export enum BadgeCategory {
  SOCIAL = 'social',
  EVENTS = 'events',
  COMMUNITY = 'community',
  WELLNESS = 'wellness',
  SPECIAL = 'special',
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;

  // Requirements
  requirement: string;
  requiredCount?: number;

  // Rarity
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  // Rewards
  experiencePoints: number;
  avatarUnlock?: string;

  createdAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress?: number; // For tracking towards next level
}

export enum MissionType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SPECIAL = 'special',
  ACHIEVEMENT = 'achievement',
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;

  // Requirements
  requirement: MissionRequirement;
  targetCount: number;

  // Rewards
  experiencePoints: number;
  badgeId?: string;

  // Availability
  startDate?: Date;
  endDate?: Date;

  // Difficulty
  difficulty: 'easy' | 'medium' | 'hard';

  createdAt: Date;
}

export interface MissionRequirement {
  type: 'join_events' | 'make_friends' | 'post' | 'like' | 'vote' | 'attend_event' | 'create_event' | 'help_others' | 'daily_checkin';
  count: number;
  eventType?: string;
  timeframe?: 'day' | 'week' | 'month';
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;

  progress: number;
  isCompleted: boolean;
  completedAt?: Date;

  // For daily/weekly missions
  resetAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface Streak {
  id: string;
  userId: string;

  currentStreak: number;
  longestStreak: number;

  lastCheckInDate: Date;
  streakStartDate: Date;

  // Milestones reached
  milestones: number[]; // [7, 14, 30, 60, 100, etc.]

  updatedAt: Date;
}

export interface LevelSystem {
  level: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  totalExperience: number;
}

// XP calculation
export const LEVEL_XP_REQUIREMENTS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, // Levels 1-10
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300, // Levels 11-20
  // Continues...
];

export const XP_REWARDS = {
  JOIN_EVENT: 10,
  ATTEND_EVENT: 25,
  CREATE_EVENT: 50,
  MAKE_FRIEND: 20,
  POST_MESSAGE: 5,
  LIKE_POST: 2,
  VOTE_ENTRY: 5,
  DAILY_CHECKIN: 15,
  COMPLETE_MISSION: 30,
  EARN_BADGE: 50,
  HELP_FRIEND: 15,
  STREAK_DAY: 10,
};
