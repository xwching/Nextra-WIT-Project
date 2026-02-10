// Export all services from a single entry point
export { AuthService } from './firebase/auth.service';
export { EventsAPI } from './api/events.api';
export { FriendsAPI } from './api/friends.api';
export { GamificationAPI } from './api/gamification.api';
export { NotificationsAPI } from './api/notifications.api';

// Export Firebase config
export { db, auth, storage, functions, COLLECTIONS } from './firebase/config';

// Re-export types
export * from '@/types/user.types';
export * from '@/types/event.types';
export * from '@/types/social.types';
export * from '@/types/gamification.types';
