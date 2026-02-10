export enum EventType {
  CREATIVE = 'creative',
  TECH = 'tech',
  GAMES = 'games',
  SOCIAL = 'social',
  LEARNING = 'learning',
  ACTIVITY = 'activity',
  COMMUNITY = 'community',
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;

  // Creator & Moderation
  creatorId: string;
  moderatorIds: string[];

  // Event Details
  startTime: Date;
  endTime: Date;
  location: 'online' | 'in-person' | 'hybrid';
  locationDetails?: string;

  // Participation
  maxParticipants?: number;
  currentParticipants: number;
  participantIds: string[];
  waitlistIds: string[];

  // Event Properties
  isCompetition: boolean;
  isKidFriendly: boolean;
  isPrivate: boolean;
  requiresApproval: boolean;

  // Competition settings
  votingEnabled?: boolean;
  votingStartTime?: Date;
  votingEndTime?: Date;

  // Rules & Guidelines
  rules: string[];
  tags: string[];

  // Status
  status: EventStatus;
  isLive: boolean;

  // Stats
  viewCount: number;
  interestCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  role: 'creator' | 'moderator' | 'participant';
  joinedAt: Date;
  hasSubmittedEntry?: boolean;
  entryId?: string;
}

export interface EventChat {
  id: string;
  eventId: string;
  name: string;
  description?: string;

  // Chat settings
  isMainChat: boolean;
  isPublic: boolean;
  requiresApproval: boolean;

  // Members
  creatorId: string;
  moderatorIds: string[];
  memberIds: string[];
  maxMembers?: number;

  // Settings
  isMuted: boolean;

  // Stats
  messageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface EventPost {
  id: string;
  eventId: string;
  authorId: string;

  content: string;
  images?: string[];

  isPinned: boolean;

  // Engagement
  likes: string[]; // User IDs
  likeCount: number;
  replyCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface EventEntry {
  id: string;
  eventId: string;
  participantId: string;

  title: string;
  description: string;
  submissionUrl?: string;
  images?: string[];

  // Voting (if competition)
  votes: string[]; // User IDs who voted
  voteCount: number;

  // Status
  isApproved: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface EventFilter {
  type?: EventType;
  status?: EventStatus;
  isKidFriendly?: boolean;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}
