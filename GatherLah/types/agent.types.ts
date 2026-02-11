/**
 * Strands-style AI Social Agent Types
 * Stateful, goal-driven agent that prevents social drift and loneliness
 */

// ── User Activity Snapshot ──────────────────────────────────
export interface UserActivity {
  userId: string;
  lastEventJoined: Date | null;
  lastChatSent: Date | null;
  lastActive: Date;
  streak: number;
  missedEvents: number;       // events that started while user was inactive
  friendCount: number;
  eventsJoinedLast7Days: number;
  eventsJoinedLast30Days: number;
  chatsSentLast7Days: number;
  friendRequestsSentLast7Days: number;
  kidSafe: boolean;           // child account flag
  updatedAt: Date;
}

// ── Loneliness Score ────────────────────────────────────────
export interface LonelinessScore {
  userId: string;
  score: number;              // 0 (very social) – 100 (high isolation risk)
  components: {
    inactivityDays: number;   // weighted contribution
    missedEvents: number;
    streakDecay: number;
    chatInactivity: number;
    lowFriendCount: number;
  };
  trend: 'improving' | 'stable' | 'worsening';
  previousScore: number;
  computedAt: Date;
}

// ── AI Nudge ────────────────────────────────────────────────
export interface AINudge {
  id: string;
  userId: string;
  message: string;            // warm, human-sounding nudge text
  suggestedEventId: string | null;
  suggestedEventTitle: string | null;
  suggestedFriendId: string | null;
  suggestedFriendName: string | null;
  category: NudgeCategory;
  priority: 'low' | 'medium' | 'high';
  lonelinessScoreAtTime: number;
  isRead: boolean;
  isDismissed: boolean;
  outcome: NudgeOutcome | null;
  createdAt: Date;
  readAt: Date | null;
}

export type NudgeCategory =
  | 'event_suggestion'
  | 'friend_reconnect'
  | 'streak_encouragement'
  | 'general_tip'
  | 'comeback_welcome'
  | 'milestone_celebration';

export interface NudgeOutcome {
  joinedEvent: boolean;
  chattedWithFriend: boolean;
  streakImproved: boolean;
  measuredAt: Date;
}

// ── Agent Memory ────────────────────────────────────────────
export interface AgentMemory {
  userId: string;
  totalNudgesSent: number;
  totalNudgesRead: number;
  totalNudgesActedOn: number;
  successRate: number;        // 0–1
  preferredNudgeCategory: NudgeCategory | null;
  averageResponseTime: number | null;  // ms from nudge to action
  tonePreference: 'casual' | 'warm' | 'motivational';
  nudgeFrequency: 'daily' | 'every_other_day' | 'weekly';
  lastNudgeSentAt: Date | null;
  lastOutcomeCheckedAt: Date | null;
  nudgeHistory: NudgeHistoryEntry[];
  updatedAt: Date;
}

export interface NudgeHistoryEntry {
  nudgeId: string;
  category: NudgeCategory;
  sentAt: Date;
  wasRead: boolean;
  wasActedOn: boolean;
  lonelinessScoreBefore: number;
  lonelinessScoreAfter: number | null;
}

// ── Agent Decision ──────────────────────────────────────────
export interface AgentDecision {
  shouldNudge: boolean;
  reason: string;
  category: NudgeCategory;
  priority: 'low' | 'medium' | 'high';
  context: {
    lonelinessScore: number;
    trend: string;
    daysSinceLastNudge: number;
    recentSuccessRate: number;
  };
}

// ── GPT Prompt Context ──────────────────────────────────────
export interface NudgePromptContext {
  userName: string;
  streak: number;
  daysSinceLastEvent: number | null;
  daysSinceLastChat: number | null;
  friendCount: number;
  lonelinessScore: number;
  trend: string;
  availableEvents: { id: string; title: string; type: string; startTime: string }[];
  activeFriends: { id: string; name: string; isOnline: boolean }[];
  pastNudgeOutcomes: { category: string; wasActedOn: boolean }[];
  tonePreference: string;
  kidSafe: boolean;
  category: NudgeCategory;
}

// ── GPT Response ────────────────────────────────────────────
export interface NudgeGPTResponse {
  message: string;
  suggestedEvent: string;     // event title or ""
  suggestedFriend: string;    // friend name or ""
}
