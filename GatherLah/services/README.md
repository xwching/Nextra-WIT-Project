# GatherLah Backend Services

Comprehensive backend services for the GatherLah social event platform built on Firebase.

## 🏗️ Architecture Overview

```
services/
├── firebase/              # Firebase configuration and core services
│   ├── config.ts         # Firebase initialization and collection names
│   └── auth.service.ts   # Authentication with parent-child account support
│
├── api/                   # Feature-specific API services
│   ├── events.api.ts     # Event CRUD, participants, chats, posts, entries
│   ├── friends.api.ts    # Friend requests, following, messaging
│   ├── gamification.api.ts # Badges, missions, streaks, XP system
│   └── notifications.api.ts # Push notifications and in-app alerts
│
└── index.ts              # Central export point
```

## 🔑 Key Features

### 1. **Authentication System** (`auth.service.ts`)

Supports three account types:
- **Normal Account**: Full access to all features
- **Parent Account**: Can link and monitor child accounts
- **Child Account**: Kid-friendly content only, parental monitoring

```typescript
// Sign up a normal user
await AuthService.signUp(email, password, username, displayName, AccountType.NORMAL);

// Link child to parent
await AuthService.linkChildToParent(childId, parentId, ['creative', 'learning'], 120);

// Get child activity for monitoring
const activity = await AuthService.getChildActivityData(parentId, childId);
```

### 2. **Events System** (`events.api.ts`)

Comprehensive event management:
- Create events with competition/non-competition modes
- Moderator system for community management
- Multiple chat rooms per event (main + custom)
- Post feed with pinning capability
- Competition entries with voting
- Kid-friendly filtering

```typescript
// Create event
const event = await EventsAPI.createEvent(userId, {
  title: 'Digital Art Challenge',
  type: EventType.CREATIVE,
  isCompetition: true,
  isKidFriendly: true,
  maxParticipants: 50,
  // ... other details
});

// Join event (auto-checks kid-friendly for child accounts)
await EventsAPI.joinEvent(eventId, userId);

// Submit competition entry
await EventsAPI.submitEntry(eventId, userId, title, description, imageUrl);
```

### 3. **Social System** (`friends.api.ts`)

Rich social features:
- Friend requests with context
- Following system (different from friends)
- Direct messaging
- Friend suggestions based on interests and mutual friends

```typescript
// Send friend request with context
await FriendsAPI.sendFriendRequest(senderId, receiverId,
  "Hey! Great to meet you at the event",
  "Met at Drawing Challenge event");

// Follow user
await FriendsAPI.followUser(followerId, followingId);

// Get friend suggestions
const suggestions = await FriendsAPI.getFriendSuggestions(userId, 10);

// Send DM
await FriendsAPI.sendMessage(senderId, receiverId, "Hey, want to collaborate?");
```

### 4. **Gamification System** (`gamification.api.ts`)

Engagement mechanics to combat social isolation:
- **XP & Levels**: Progress system with meaningful rewards
- **Daily Streaks**: Encourages regular engagement (7, 14, 30, 60, 100+ day milestones)
- **Badges**: Achievements for social, event, community, and wellness activities
- **Missions**: Daily, weekly, and special challenges

```typescript
// Update daily streak (awards XP)
const streak = await GamificationAPI.updateStreak(userId);

// Award badge
await GamificationAPI.awardBadge(userId, badgeId);

// Update mission progress
await GamificationAPI.updateMissionProgress(userId, 'join_events', 1);

// Award XP for actions
await GamificationAPI.awardExperience(userId, 25, 'Attended event');
```

### 5. **Notifications System** (`notifications.api.ts`)

Multi-channel notification system:
- In-app notifications
- Push notifications (TODO: integrate with Expo Notifications)
- Granular settings per notification type
- Smart notification grouping

```typescript
// Create notification
await NotificationsAPI.createNotification(
  userId,
  NotificationType.FRIEND_REQUEST,
  'New Friend Request',
  'Someone sent you a friend request'
);

// Get notifications
const notifications = await NotificationsAPI.getUserNotifications(userId, 50);

// Mark as read
await NotificationsAPI.markAsRead(notificationId);
```

## 🎮 XP & Rewards System

### XP Rewards
```typescript
XP_REWARDS = {
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
}
```

### Leveling System
- Level 1-10: 100-3800 XP
- Level 11-20: 4700-17300 XP
- Each level unlocks new avatar customizations and features

## 📊 Firestore Collections

### Core Collections
```typescript
COLLECTIONS = {
  USERS: 'users',                      // User profiles
  EVENTS: 'events',                    // Event data
  EVENT_PARTICIPANTS: 'eventParticipants',
  EVENT_CHATS: 'eventChats',
  EVENT_ENTRIES: 'eventEntries',

  POSTS: 'posts',                      // Event posts
  MESSAGES: 'messages',                // Direct messages
  CHATS: 'chats',                      // Conversations

  BADGES: 'badges',                    // Badge definitions
  USER_BADGES: 'userBadges',           // User badge awards
  MISSIONS: 'missions',                // Mission definitions
  USER_MISSIONS: 'userMissions',       // User mission progress
  STREAKS: 'streaks',                  // Daily streak tracking

  FRIEND_REQUESTS: 'friendRequests',
  FOLLOWERS: 'followers',
  NOTIFICATIONS: 'notifications',

  PARENT_CHILD_LINKS: 'parentChildLinks', // Parent-child relationships
  REPORTS: 'reports',                  // Safety reports
  MENTAL_WELLNESS_LOGS: 'mentalWellnessLogs',
}
```

## 👨‍👩‍👧 Parent-Child Account System

Special privacy and safety features for kids:

### Child Account Restrictions
- Only see kid-friendly events
- Private profile by default
- Cannot receive friend requests from strangers
- Location sharing disabled
- Online status hidden

### Parent Monitoring
- View joined events
- See friends list
- Track screen time
- Set allowed event types
- Activity dashboard

```typescript
// Parent can view child's activity
const activity = await AuthService.getChildActivityData(parentId, childId);
// Returns:
// {
//   profile: { username, level, currentStreak },
//   joinedEvents: count,
//   friendsCount: count,
//   recentActivity: [],
//   screenTime: minutes
// }
```

## 🎯 Mental Well-being Features

Addressing the problem statement of social isolation:

### 1. **Daily Streak System**
- Encourages regular social engagement
- Milestone rewards at 7, 14, 30, 60, 100 days
- Visible progress tracking

### 2. **Mood Tracking**
- Users can log daily mood
- Wellness score calculation
- Gentle reminders to check in

### 3. **Mission System**
Examples of social-focused missions:
- "Make 3 new friends this week"
- "Join 5 events this month"
- "Help 2 friends by liking their posts"
- "Post encouraging comments on 3 entries"

### 4. **Suggested Friends**
- Algorithm finds people with similar interests
- Encourages expanding social circles
- Reduces barrier to making connections

### 5. **Community Events**
- Large collaborative events (r/place style)
- Everyone can participate
- Sense of belonging to larger community

## 🚀 Getting Started

### 1. Set up Firebase

Create a `.env` file:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Install Dependencies

```bash
npm install firebase @react-native-async-storage/async-storage
```

### 3. Use in Components

```typescript
import { AuthService, EventsAPI, FriendsAPI } from '@/services';

// Sign up
const user = await AuthService.signUp(email, password, username, displayName);

// Create event
const event = await EventsAPI.createEvent(userId, eventData);

// Send friend request
await FriendsAPI.sendFriendRequest(senderId, receiverId, message);
```

## 🔒 Security Considerations

### Firestore Rules (TODO)
- Users can only edit their own data
- Child accounts have additional read restrictions
- Event moderators have special write permissions
- Parents can read child account data

### Input Validation
- All user inputs are sanitized
- Email validation on signup
- Age verification for child accounts
- Content moderation flags for reports

## 📈 Future Enhancements

### Phase 2 Features
- [ ] AI-powered friend matching
- [ ] Video chat for events
- [ ] Advanced analytics dashboard
- [ ] Community moderation tools
- [ ] Mental wellness resources integration
- [ ] Professional counselor connections
- [ ] Group therapy event type
- [ ] Anonymous support groups

### Phase 3 Features
- [ ] Local event recommendations based on location
- [ ] Integration with calendar apps
- [ ] Event reminders via SMS
- [ ] Collaborative event planning tools
- [ ] Event templates library
- [ ] Advanced gamification (seasons, battle pass)

## 📝 API Response Patterns

All API methods follow consistent error handling:

```typescript
try {
  const result = await SomeAPI.someMethod(params);
  // Success
} catch (error) {
  // Error message is user-friendly
  console.error(error.message);
  // Show to user in UI
}
```

## 🤝 Contributing

When adding new features:
1. Add type definitions in `/types`
2. Create service methods in appropriate `/api` file
3. Add collection name to COLLECTIONS in config
4. Update this README
5. Add Firestore security rules
6. Add tests (TODO)

## 📞 Support

For questions or issues, see the main project README or create an issue on GitHub.

---

**Built with ❤️ to combat social isolation and strengthen communities**
