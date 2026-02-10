export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  message?: string;
  context?: string; // e.g., "Met at Drawing Challenge event"
  createdAt: Date;
  respondedAt?: Date;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  isCloseFriend: boolean;
  createdAt: Date;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;

  content: string;
  type: 'text' | 'image' | 'event-invite' | 'friend-request';

  // Metadata
  isRead: boolean;
  readAt?: Date;

  // Optional data for different types
  eventId?: string; // For event invites
  imageUrl?: string; // For images

  createdAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;

  title: string;
  message: string;

  // Related entity IDs
  relatedUserId?: string;
  relatedEventId?: string;
  relatedPostId?: string;

  // Status
  isRead: boolean;
  readAt?: Date;

  // Action URL
  actionUrl?: string;

  createdAt: Date;
}

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  NEW_FOLLOWER = 'new_follower',
  EVENT_INVITE = 'event_invite',
  EVENT_REMINDER = 'event_reminder',
  EVENT_STARTING = 'event_starting',
  EVENT_CANCELLED = 'event_cancelled',
  NEW_MESSAGE = 'new_message',
  POST_LIKE = 'post_like',
  POST_REPLY = 'post_reply',
  ENTRY_VOTE = 'entry_vote',
  BADGE_EARNED = 'badge_earned',
  MISSION_COMPLETED = 'mission_completed',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  FRIEND_ACTIVITY = 'friend_activity',
  DAILY_REMINDER = 'daily_reminder',
  WELLNESS_CHECK = 'wellness_check',
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedEventId?: string;
  reportedPostId?: string;
  reportedChatId?: string;

  reason: ReportReason;
  description: string;

  status: 'pending' | 'reviewed' | 'resolved';

  createdAt: Date;
  resolvedAt?: Date;
}

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  SAFETY_CONCERN = 'safety_concern',
  FAKE_ACCOUNT = 'fake_account',
  OTHER = 'other',
}
