export enum AccountType {
  NORMAL = 'normal',
  PARENT = 'parent',
  CHILD = 'child',
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  accountType: AccountType;

  // Parent-Child relationship
  parentId?: string; // For child accounts
  childIds?: string[]; // For parent accounts
  isKidFriendlyOnly?: boolean; // Child account restriction

  // Profile details
  dateOfBirth?: Date;
  interests: string[];
  location?: string;

  // Social stats
  friendsCount: number;
  followersCount: number;
  followingCount: number;

  // Gamification
  level: number;
  experiencePoints: number;
  currentStreak: number;
  longestStreak: number;
  totalEventsJoined: number;
  totalEventsCreated: number;

  // Mental wellness
  moodHistory: MoodEntry[];
  wellnessScore: number;

  // Settings
  isOnline: boolean;
  lastSeen: Date;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface MoodEntry {
  mood: 'great' | 'good' | 'okay' | 'low' | 'struggling';
  emoji: string;
  timestamp: Date;
  note?: string;
}

export interface NotificationSettings {
  friendRequests: boolean;
  eventInvites: boolean;
  eventUpdates: boolean;
  messages: boolean;
  friendActivity: boolean;
  badges: boolean;
  missions: boolean;
  communityEvents: boolean;
  dailyReminders: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  showActivity: boolean;
  allowFriendRequests: 'everyone' | 'friendsOfFriends' | 'none';
  showLocation: boolean;
}

export interface ParentChildLink {
  id: string;
  parentId: string;
  childId: string;
  monitoringEnabled: boolean;
  allowedEventTypes: string[];
  screenTimeLimit?: number; // minutes per day
  createdAt: Date;
}

export interface UserProfile extends User {
  badges: Badge[];
  completedMissions: Mission[];
  joinedEvents: string[]; // Event IDs
  createdEvents: string[]; // Event IDs
  friends: string[]; // User IDs
  followers: string[]; // User IDs
  following: string[]; // User IDs
}
