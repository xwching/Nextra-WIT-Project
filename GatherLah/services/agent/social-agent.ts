/**
 * Social Momentum Agent — Strands-style stateful agent loop
 *
 * Agent lifecycle (runs on each app open / periodic trigger):
 *   1. Gather user state  →  UserActivity
 *   2. Compute loneliness score
 *   3. Decide whether to intervene
 *   4. Generate nudge (GPT or template)
 *   5. Store nudge + update memory
 *   6. On next run: measure outcome of previous nudge → adapt
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase/config';
import {
  UserActivity,
  LonelinessScore,
  AINudge,
  AgentMemory,
  AgentDecision,
  NudgePromptContext,
  NudgeCategory,
  NudgeHistoryEntry,
  NudgeOutcome,
} from '@/types/agent.types';
import { User } from '@/types/user.types';
import { Event, EventStatus } from '@/types/event.types';
import { Friendship } from '@/types/social.types';
import { computeAndStoreLonelinessScore } from './loneliness-score';
import { generateNudge, sanitizeForKids } from './ai-nudge';
import { AGENT_CONFIG } from './agent-config';

// ══════════════════════════════════════════════════════════════
// 1. GATHER USER STATE
// ══════════════════════════════════════════════════════════════

export async function gatherUserActivity(userId: string): Promise<UserActivity> {
  const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!userSnap.exists()) throw new Error('User not found');
  const user = userSnap.data() as User;

  // Count friends
  let friendCount = user.friendsCount || 0;

  // Last event joined — check events the user participated in
  let lastEventJoined: Date | null = null;
  let eventsJoined7 = 0;
  let eventsJoined30 = 0;
  let missedEvents = 0;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const participantQuery = query(
      collection(db, COLLECTIONS.EVENT_PARTICIPANTS),
      where('userId', '==', userId),
      limit(30)
    );
    const partSnap = await getDocs(participantQuery);
    for (const d of partSnap.docs) {
      const data = d.data();
      const joinedAt = data.joinedAt?.toDate?.() || new Date(data.joinedAt);
      if (!lastEventJoined || joinedAt > lastEventJoined) lastEventJoined = joinedAt;
      if (joinedAt >= sevenDaysAgo) eventsJoined7++;
      if (joinedAt >= thirtyDaysAgo) eventsJoined30++;
    }
  } catch (_) { /* no participation records */ }

  // Count recently missed events (upcoming events user could have joined)
  try {
    const upcomingQuery = query(
      collection(db, COLLECTIONS.EVENTS),
      where('status', '==', EventStatus.ENDED),
      limit(10)
    );
    const eventsSnap = await getDocs(upcomingQuery);
    for (const d of eventsSnap.docs) {
      const ev = d.data();
      const participantIds: string[] = ev.participantIds || [];
      if (!participantIds.includes(userId)) {
        const endTime = ev.endTime?.toDate?.() || new Date(ev.endTime);
        if (endTime >= sevenDaysAgo) missedEvents++;
      }
    }
  } catch (_) { /* ignore */ }

  // Last chat sent
  let lastChatSent: Date | null = null;
  let chatsSent7 = 0;
  try {
    const msgQuery = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('senderId', '==', userId),
      limit(20)
    );
    const msgSnap = await getDocs(msgQuery);
    for (const d of msgSnap.docs) {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      if (!lastChatSent || createdAt > lastChatSent) lastChatSent = createdAt;
      if (createdAt >= sevenDaysAgo) chatsSent7++;
    }
  } catch (_) { /* no messages */ }

  // Friend requests sent
  let friendRequestsSent7 = 0;
  try {
    const frQuery = query(
      collection(db, COLLECTIONS.FRIEND_REQUESTS),
      where('senderId', '==', userId),
      limit(20)
    );
    const frSnap = await getDocs(frQuery);
    for (const d of frSnap.docs) {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      if (createdAt >= sevenDaysAgo) friendRequestsSent7++;
    }
  } catch (_) { /* ignore */ }

  const lastSeen = user.lastSeen
    ? (typeof (user.lastSeen as any).toDate === 'function'
      ? (user.lastSeen as any).toDate()
      : new Date(user.lastSeen as any))
    : now;

  const activity: UserActivity = {
    userId,
    lastEventJoined,
    lastChatSent,
    lastActive: lastSeen,
    streak: user.currentStreak || 0,
    missedEvents: Math.min(missedEvents, 10),
    friendCount,
    eventsJoinedLast7Days: eventsJoined7,
    eventsJoinedLast30Days: eventsJoined30,
    chatsSentLast7Days: chatsSent7,
    friendRequestsSentLast7Days: friendRequestsSent7,
    kidSafe: user.isKidFriendlyOnly || user.accountType === 'child',
    updatedAt: now,
  };

  // Store activity snapshot
  await setDoc(doc(db, COLLECTIONS.USER_ACTIVITY, userId), {
    ...activity,
    updatedAt: serverTimestamp(),
  });

  return activity;
}

// ══════════════════════════════════════════════════════════════
// 2. AGENT DECISION
// ══════════════════════════════════════════════════════════════

function pickCategory(score: LonelinessScore, activity: UserActivity): NudgeCategory {
  const now = new Date();
  const inactiveDays = activity.lastActive
    ? Math.floor((now.getTime() - new Date(activity.lastActive).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (inactiveDays >= AGENT_CONFIG.COMEBACK_INACTIVE_DAYS) return 'comeback_welcome';
  if (activity.streak > 0 && activity.streak % 7 === 0) return 'milestone_celebration';
  if (score.components.streakDecay > 10) return 'streak_encouragement';
  if (score.components.chatInactivity > 10 && activity.friendCount > 0) return 'friend_reconnect';
  if (score.components.missedEvents > 5) return 'event_suggestion';
  return 'general_tip';
}

export function makeDecision(
  score: LonelinessScore,
  memory: AgentMemory | null,
  activity: UserActivity
): AgentDecision {
  const daysSinceLastNudge = memory?.lastNudgeSentAt
    ? Math.floor((Date.now() - new Date(memory.lastNudgeSentAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const hoursSinceLastNudge = memory?.lastNudgeSentAt
    ? (Date.now() - new Date(memory.lastNudgeSentAt).getTime()) / (1000 * 60 * 60)
    : 999;

  // Respect frequency limits
  if (hoursSinceLastNudge < AGENT_CONFIG.MIN_HOURS_BETWEEN_NUDGES) {
    return {
      shouldNudge: false,
      reason: 'Too soon since last nudge',
      category: 'general_tip',
      priority: 'low',
      context: {
        lonelinessScore: score.score,
        trend: score.trend,
        daysSinceLastNudge,
        recentSuccessRate: memory?.successRate || 0,
      },
    };
  }

  // Adapt frequency based on success rate
  const effectiveThreshold = memory && memory.successRate < 0.2
    ? AGENT_CONFIG.NUDGE_SCORE_THRESHOLD + 15  // raise threshold if nudges aren't working
    : AGENT_CONFIG.NUDGE_SCORE_THRESHOLD;

  const shouldNudge = score.score >= effectiveThreshold || score.trend === 'worsening';

  const priority = score.score >= AGENT_CONFIG.HIGH_PRIORITY_THRESHOLD
    ? 'high'
    : score.score >= AGENT_CONFIG.MEDIUM_PRIORITY_THRESHOLD
      ? 'medium'
      : 'low';

  const category = pickCategory(score, activity);

  return {
    shouldNudge,
    reason: shouldNudge
      ? `Score ${score.score} (${score.trend}), threshold ${effectiveThreshold}`
      : `Score ${score.score} below threshold ${effectiveThreshold}`,
    category,
    priority,
    context: {
      lonelinessScore: score.score,
      trend: score.trend,
      daysSinceLastNudge,
      recentSuccessRate: memory?.successRate || 0,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// 3. BUILD PROMPT CONTEXT
// ══════════════════════════════════════════════════════════════

async function buildPromptContext(
  userId: string,
  activity: UserActivity,
  score: LonelinessScore,
  memory: AgentMemory | null,
  category: NudgeCategory
): Promise<NudgePromptContext> {
  const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  const user = userSnap.data() as User;

  // Get upcoming events
  const availableEvents: NudgePromptContext['availableEvents'] = [];
  try {
    const evQuery = query(
      collection(db, COLLECTIONS.EVENTS),
      where('status', '==', EventStatus.UPCOMING),
      limit(5)
    );
    const evSnap = await getDocs(evQuery);
    for (const d of evSnap.docs) {
      const ev = d.data() as Event;
      if (activity.kidSafe && !ev.isKidFriendly) continue;
      availableEvents.push({
        id: d.id,
        title: ev.title,
        type: ev.type,
        startTime: new Date(ev.startTime as any).toISOString(),
      });
    }
  } catch (_) { /* no events */ }

  // Get active friends
  const activeFriends: NudgePromptContext['activeFriends'] = [];
  try {
    const friendsSnap = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/friends`));
    for (const d of friendsSnap.docs) {
      const f = d.data() as Friendship;
      const friendId = f.userId1 === userId ? f.userId2 : f.userId1;
      const friendSnap = await getDoc(doc(db, COLLECTIONS.USERS, friendId));
      if (friendSnap.exists()) {
        const friendData = friendSnap.data() as User;
        activeFriends.push({
          id: friendId,
          name: friendData.displayName,
          isOnline: friendData.isOnline || false,
        });
      }
      if (activeFriends.length >= 5) break;
    }
  } catch (_) { /* no friends */ }

  // Past nudge outcomes (last 5)
  const pastOutcomes = (memory?.nudgeHistory || []).slice(-5).map(h => ({
    category: h.category,
    wasActedOn: h.wasActedOn,
  }));

  return {
    userName: user.displayName || user.username,
    streak: activity.streak,
    daysSinceLastEvent: activity.lastEventJoined
      ? Math.floor((Date.now() - new Date(activity.lastEventJoined).getTime()) / (1000 * 60 * 60 * 24))
      : null,
    daysSinceLastChat: activity.lastChatSent
      ? Math.floor((Date.now() - new Date(activity.lastChatSent).getTime()) / (1000 * 60 * 60 * 24))
      : null,
    friendCount: activity.friendCount,
    lonelinessScore: score.score,
    trend: score.trend,
    availableEvents,
    activeFriends,
    pastNudgeOutcomes: pastOutcomes,
    tonePreference: memory?.tonePreference || 'warm',
    kidSafe: activity.kidSafe,
    category,
  };
}

// ══════════════════════════════════════════════════════════════
// 4. AGENT MEMORY
// ══════════════════════════════════════════════════════════════

async function getAgentMemory(userId: string): Promise<AgentMemory | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.AGENT_MEMORY, userId));
    if (!snap.exists()) return null;
    return snap.data() as AgentMemory;
  } catch (_) {
    return null;
  }
}

function createDefaultMemory(userId: string): AgentMemory {
  return {
    userId,
    totalNudgesSent: 0,
    totalNudgesRead: 0,
    totalNudgesActedOn: 0,
    successRate: 0,
    preferredNudgeCategory: null,
    averageResponseTime: null,
    tonePreference: 'warm',
    nudgeFrequency: 'daily',
    lastNudgeSentAt: null,
    lastOutcomeCheckedAt: null,
    nudgeHistory: [],
    updatedAt: new Date(),
  };
}

async function updateMemoryAfterNudge(
  userId: string,
  memory: AgentMemory,
  nudge: AINudge,
  score: LonelinessScore
): Promise<void> {
  const historyEntry: NudgeHistoryEntry = {
    nudgeId: nudge.id,
    category: nudge.category,
    sentAt: nudge.createdAt,
    wasRead: false,
    wasActedOn: false,
    lonelinessScoreBefore: score.score,
    lonelinessScoreAfter: null,
  };

  const updatedHistory = [...memory.nudgeHistory.slice(-19), historyEntry]; // keep last 20
  const updatedMemory: AgentMemory = {
    ...memory,
    totalNudgesSent: memory.totalNudgesSent + 1,
    lastNudgeSentAt: nudge.createdAt,
    nudgeHistory: updatedHistory,
    updatedAt: new Date(),
  };

  await setDoc(doc(db, COLLECTIONS.AGENT_MEMORY, userId), {
    ...updatedMemory,
    updatedAt: serverTimestamp(),
  });
}

// ══════════════════════════════════════════════════════════════
// 5. OUTCOME MEASUREMENT (feedback loop)
// ══════════════════════════════════════════════════════════════

export async function measureOutcomes(userId: string): Promise<void> {
  const memory = await getAgentMemory(userId);
  if (!memory || memory.nudgeHistory.length === 0) return;

  const activity = await gatherUserActivity(userId);
  const now = new Date();
  let updated = false;

  for (let i = memory.nudgeHistory.length - 1; i >= 0; i--) {
    const entry = memory.nudgeHistory[i];
    if (entry.wasActedOn) continue; // already measured

    const sentAt = new Date(entry.sentAt);
    const hoursSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSent < AGENT_CONFIG.OUTCOME_CHECK_DELAY_HOURS) continue;

    // Check if user acted after the nudge
    const joinedEvent = activity.lastEventJoined
      ? new Date(activity.lastEventJoined) > sentAt
      : false;
    const chattedWithFriend = activity.lastChatSent
      ? new Date(activity.lastChatSent) > sentAt
      : false;
    const streakImproved = activity.streak > 0;

    const wasActedOn = joinedEvent || chattedWithFriend || streakImproved;

    memory.nudgeHistory[i] = {
      ...entry,
      wasRead: true, // assume read if we're measuring
      wasActedOn,
      lonelinessScoreAfter: null, // will be set on next score computation
    };

    if (wasActedOn) memory.totalNudgesActedOn++;
    memory.totalNudgesRead++;
    updated = true;

    // Only check the last 3 unresolved nudges per run
    if (memory.nudgeHistory.length - i > 3) break;
  }

  if (updated) {
    // Recalculate success rate
    memory.successRate = memory.totalNudgesRead > 0
      ? memory.totalNudgesActedOn / memory.totalNudgesRead
      : 0;

    // Adapt nudge frequency based on success
    if (memory.successRate > 0.5) {
      memory.nudgeFrequency = 'daily';
    } else if (memory.successRate > 0.2) {
      memory.nudgeFrequency = 'every_other_day';
    } else {
      memory.nudgeFrequency = 'weekly';
    }

    // Adapt tone based on pattern
    const recentActedOn = memory.nudgeHistory.slice(-5).filter(h => h.wasActedOn);
    const recentCategories = recentActedOn.map(h => h.category);
    if (recentCategories.includes('streak_encouragement')) {
      memory.tonePreference = 'motivational';
    } else if (recentCategories.includes('friend_reconnect')) {
      memory.tonePreference = 'warm';
    }

    memory.lastOutcomeCheckedAt = now;
    memory.updatedAt = now;

    await setDoc(doc(db, COLLECTIONS.AGENT_MEMORY, userId), {
      ...memory,
      updatedAt: serverTimestamp(),
    });
  }
}

// ══════════════════════════════════════════════════════════════
// 6. MAIN AGENT LOOP
// ══════════════════════════════════════════════════════════════

/**
 * Run the full social momentum agent for a user.
 *
 * Call this on app foreground, screen focus, or on a periodic timer.
 * Returns the new nudge if one was generated, or null.
 */
export async function runSocialMomentumAgent(userId: string): Promise<AINudge | null> {
  try {
    // Step 1: Gather state
    const activity = await gatherUserActivity(userId);

    // Step 2: Compute loneliness score
    const score = await computeAndStoreLonelinessScore(activity);

    // Step 3: Load memory
    let memory = await getAgentMemory(userId);
    if (!memory) {
      memory = createDefaultMemory(userId);
    }

    // Step 3.5: Measure outcomes of previous nudges
    await measureOutcomes(userId);

    // Step 4: Decide
    const decision = makeDecision(score, memory, activity);

    if (!decision.shouldNudge) {
      return null;
    }

    // Step 5: Build context + generate nudge
    const promptContext = await buildPromptContext(
      userId, activity, score, memory, decision.category
    );
    let nudgeResponse = await generateNudge(promptContext);

    // Kid safety filter
    if (activity.kidSafe) {
      nudgeResponse = sanitizeForKids(nudgeResponse);
    }

    // Resolve suggested event/friend to IDs
    let suggestedEventId: string | null = null;
    let suggestedFriendId: string | null = null;
    if (nudgeResponse.suggestedEvent) {
      const ev = promptContext.availableEvents.find(
        e => e.title === nudgeResponse.suggestedEvent
      );
      if (ev) suggestedEventId = ev.id;
    }
    if (nudgeResponse.suggestedFriend) {
      const fr = promptContext.activeFriends.find(
        f => f.name === nudgeResponse.suggestedFriend
      );
      if (fr) suggestedFriendId = fr.id;
    }

    // Step 6: Store nudge
    const nudgeId = doc(collection(db, COLLECTIONS.AI_NUDGES)).id;
    const nudge: AINudge = {
      id: nudgeId,
      userId,
      message: nudgeResponse.message,
      suggestedEventId,
      suggestedEventTitle: nudgeResponse.suggestedEvent || null,
      suggestedFriendId,
      suggestedFriendName: nudgeResponse.suggestedFriend || null,
      category: decision.category,
      priority: decision.priority,
      lonelinessScoreAtTime: score.score,
      isRead: false,
      isDismissed: false,
      outcome: null,
      createdAt: new Date(),
      readAt: null,
    };

    await setDoc(doc(db, COLLECTIONS.AI_NUDGES, nudgeId), {
      ...nudge,
      createdAt: serverTimestamp(),
    });

    // Step 7: Update memory
    await updateMemoryAfterNudge(userId, memory, nudge, score);

    return nudge;
  } catch (error) {
    console.error('Social agent error:', error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// 7. QUERY NUDGES (for the UI)
// ══════════════════════════════════════════════════════════════

/**
 * Get recent nudges for the notification screen.
 */
export async function getUserNudges(
  userId: string,
  limitCount: number = 20
): Promise<AINudge[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.AI_NUDGES),
      where('userId', '==', userId),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const nudges = snap.docs.map(d => ({ id: d.id, ...d.data() } as AINudge));

    // Sort client-side (avoids needing composite index)
    nudges.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
      return bTime - aTime;
    });

    return nudges;
  } catch (error) {
    console.error('Get nudges error:', error);
    return [];
  }
}

/**
 * Mark a nudge as read.
 */
export async function markNudgeRead(nudgeId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.AI_NUDGES, nudgeId), {
      isRead: true,
      readAt: serverTimestamp(),
    });
  } catch (_) { /* ignore */ }
}

/**
 * Dismiss a nudge.
 */
export async function dismissNudge(nudgeId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.AI_NUDGES, nudgeId), {
      isDismissed: true,
    });
  } catch (_) { /* ignore */ }
}

/**
 * Get the agent memory summary for parent monitoring.
 */
export async function getAgentSummary(userId: string) {
  const [memory, score, activity] = await Promise.all([
    getAgentMemory(userId),
    getDoc(doc(db, COLLECTIONS.LONELINESS_SCORES, userId)),
    getDoc(doc(db, COLLECTIONS.USER_ACTIVITY, userId)),
  ]);

  return {
    memory: memory || createDefaultMemory(userId),
    lonelinessScore: score.exists() ? score.data() as LonelinessScore : null,
    activity: activity.exists() ? activity.data() as UserActivity : null,
  };
}
