/**
 * Loneliness Score Engine
 *
 * Computes a 0–100 score based on user activity signals.
 * Higher score = higher isolation risk.
 *
 * Components (weights sum to 100):
 *   - Inactivity days          (30 pts)
 *   - Missed events            (15 pts)
 *   - Streak decay             (20 pts)
 *   - Chat inactivity          (20 pts)
 *   - Low friend count         (15 pts)
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase/config';
import { UserActivity, LonelinessScore } from '@/types/agent.types';

// ── Weight Constants ────────────────────────────────────────
const WEIGHTS = {
  INACTIVITY:  30,
  MISSED_EVENTS: 15,
  STREAK_DECAY: 20,
  CHAT_INACTIVITY: 20,
  LOW_FRIENDS: 15,
};

// ── Thresholds ──────────────────────────────────────────────
const THRESHOLDS = {
  MAX_INACTIVE_DAYS: 14,       // 14 days = max inactivity score
  MAX_MISSED_EVENTS: 5,        // 5 missed = max
  MAX_STREAK_EXPECTED: 7,      // expected minimum streak
  MAX_CHAT_INACTIVE_DAYS: 7,   // 7 days no chat = max
  MIN_HEALTHY_FRIENDS: 5,      // fewer than 5 = low friend score
};

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ── Score Computation ───────────────────────────────────────

export function computeLonelinessComponents(activity: UserActivity) {
  const now = new Date();

  // 1. Inactivity days (how long since last active)
  const inactiveDays = daysBetween(activity.lastActive, now);
  const inactivityRatio = clamp01(inactiveDays / THRESHOLDS.MAX_INACTIVE_DAYS);
  const inactivityScore = Math.round(inactivityRatio * WEIGHTS.INACTIVITY);

  // 2. Missed events
  const missedRatio = clamp01(activity.missedEvents / THRESHOLDS.MAX_MISSED_EVENTS);
  const missedEventsScore = Math.round(missedRatio * WEIGHTS.MISSED_EVENTS);

  // 3. Streak decay (lower streak = higher score)
  const streakRatio = clamp01(1 - (activity.streak / THRESHOLDS.MAX_STREAK_EXPECTED));
  const streakDecayScore = Math.round(streakRatio * WEIGHTS.STREAK_DECAY);

  // 4. Chat inactivity
  const chatInactiveDays = activity.lastChatSent
    ? daysBetween(activity.lastChatSent, now)
    : THRESHOLDS.MAX_CHAT_INACTIVE_DAYS; // no chats ever = max
  const chatRatio = clamp01(chatInactiveDays / THRESHOLDS.MAX_CHAT_INACTIVE_DAYS);
  const chatInactivityScore = Math.round(chatRatio * WEIGHTS.CHAT_INACTIVITY);

  // 5. Low friend count
  const friendRatio = clamp01(1 - (activity.friendCount / THRESHOLDS.MIN_HEALTHY_FRIENDS));
  const lowFriendScore = Math.round(friendRatio * WEIGHTS.LOW_FRIENDS);

  return {
    inactivityDays: inactivityScore,
    missedEvents: missedEventsScore,
    streakDecay: streakDecayScore,
    chatInactivity: chatInactivityScore,
    lowFriendCount: lowFriendScore,
  };
}

export function computeTotalScore(components: LonelinessScore['components']): number {
  return Math.min(100, Math.max(0,
    components.inactivityDays +
    components.missedEvents +
    components.streakDecay +
    components.chatInactivity +
    components.lowFriendCount
  ));
}

function determineTrend(current: number, previous: number): LonelinessScore['trend'] {
  const diff = current - previous;
  if (diff <= -5) return 'improving';
  if (diff >= 5) return 'worsening';
  return 'stable';
}

// ── Firestore Integration ───────────────────────────────────

/**
 * Compute and store the loneliness score for a user.
 * Reads the previous score for trend analysis.
 */
export async function computeAndStoreLonelinessScore(
  activity: UserActivity
): Promise<LonelinessScore> {
  const components = computeLonelinessComponents(activity);
  const totalScore = computeTotalScore(components);

  // Read previous score
  let previousScore = 50; // default neutral
  try {
    const prevDoc = await getDoc(doc(db, COLLECTIONS.LONELINESS_SCORES, activity.userId));
    if (prevDoc.exists()) {
      previousScore = prevDoc.data().score ?? 50;
    }
  } catch (_) {
    // first time — use default
  }

  const trend = determineTrend(totalScore, previousScore);

  const scoreDoc: LonelinessScore = {
    userId: activity.userId,
    score: totalScore,
    components,
    trend,
    previousScore,
    computedAt: new Date(),
  };

  await setDoc(doc(db, COLLECTIONS.LONELINESS_SCORES, activity.userId), {
    ...scoreDoc,
    computedAt: serverTimestamp(),
  });

  return scoreDoc;
}

/**
 * Read the current loneliness score from Firestore.
 */
export async function getLonelinessScore(userId: string): Promise<LonelinessScore | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.LONELINESS_SCORES, userId));
    if (!snap.exists()) return null;
    return snap.data() as LonelinessScore;
  } catch (_) {
    return null;
  }
}
