import { Mission, MissionType } from '@/types/gamification.types';

/**
 * Initial missions designed to encourage social connection and combat isolation
 * Focuses on meaningful interactions rather than just activity
 */
export const INITIAL_MISSIONS: Omit<Mission, 'id' | 'createdAt'>[] = [
  // Daily Missions - Easy, encouraging regular engagement
  {
    title: 'Daily Check-In',
    description: 'Log in and check your daily streak',
    type: MissionType.DAILY,
    requirement: {
      type: 'daily_checkin',
      count: 1,
      timeframe: 'day',
    },
    targetCount: 1,
    experiencePoints: 15,
    difficulty: 'easy',
  },
  {
    title: 'Say Hello',
    description: 'Send a message to a friend',
    type: MissionType.DAILY,
    requirement: {
      type: 'post',
      count: 1,
      timeframe: 'day',
    },
    targetCount: 1,
    experiencePoints: 20,
    difficulty: 'easy',
  },
  {
    title: 'Show Support',
    description: 'Like or vote on 3 posts/entries',
    type: MissionType.DAILY,
    requirement: {
      type: 'like',
      count: 3,
      timeframe: 'day',
    },
    targetCount: 3,
    experiencePoints: 25,
    difficulty: 'easy',
  },

  // Weekly Missions - Encouraging deeper engagement
  {
    title: 'Social Week',
    description: 'Join 3 events this week',
    type: MissionType.WEEKLY,
    requirement: {
      type: 'join_events',
      count: 3,
      timeframe: 'week',
    },
    targetCount: 3,
    experiencePoints: 100,
    difficulty: 'medium',
  },
  {
    title: 'New Connections',
    description: 'Make 2 new friends this week',
    type: MissionType.WEEKLY,
    requirement: {
      type: 'make_friends',
      count: 2,
      timeframe: 'week',
    },
    targetCount: 2,
    experiencePoints: 150,
    badgeId: 'social_butterfly_progress',
    difficulty: 'medium',
  },
  {
    title: 'Community Contributor',
    description: 'Post 5 helpful comments or messages',
    type: MissionType.WEEKLY,
    requirement: {
      type: 'post',
      count: 5,
      timeframe: 'week',
    },
    targetCount: 5,
    experiencePoints: 120,
    difficulty: 'medium',
  },
  {
    title: 'Event Regular',
    description: 'Attend 2 events this week (not just join)',
    type: MissionType.WEEKLY,
    requirement: {
      type: 'attend_event',
      count: 2,
      timeframe: 'week',
    },
    targetCount: 2,
    experiencePoints: 200,
    difficulty: 'hard',
  },

  // Special Missions - Focused on combating isolation
  {
    title: 'Break the Ice',
    description: 'Send a friend request to someone with similar interests',
    type: MissionType.SPECIAL,
    requirement: {
      type: 'make_friends',
      count: 1,
    },
    targetCount: 1,
    experiencePoints: 50,
    difficulty: 'easy',
  },
  {
    title: 'Help Others Shine',
    description: 'Vote for 10 competition entries',
    type: MissionType.SPECIAL,
    requirement: {
      type: 'vote',
      count: 10,
    },
    targetCount: 10,
    experiencePoints: 150,
    difficulty: 'medium',
  },
  {
    title: 'Be the Organizer',
    description: 'Create your first event',
    type: MissionType.SPECIAL,
    requirement: {
      type: 'create_event',
      count: 1,
    },
    targetCount: 1,
    experiencePoints: 200,
    badgeId: 'event_creator',
    difficulty: 'medium',
  },
  {
    title: 'Kindness Ambassador',
    description: 'Give 5 encouraging comments on others\' posts',
    type: MissionType.SPECIAL,
    requirement: {
      type: 'help_others',
      count: 5,
    },
    targetCount: 5,
    experiencePoints: 100,
    difficulty: 'easy',
  },

  // Achievement Missions - Long-term goals
  {
    title: 'Social Circle',
    description: 'Build a network of 10 friends',
    type: MissionType.ACHIEVEMENT,
    requirement: {
      type: 'make_friends',
      count: 10,
    },
    targetCount: 10,
    experiencePoints: 300,
    badgeId: 'social_butterfly',
    difficulty: 'hard',
  },
  {
    title: 'Event Enthusiast',
    description: 'Join 25 different events',
    type: MissionType.ACHIEVEMENT,
    requirement: {
      type: 'join_events',
      count: 25,
    },
    targetCount: 25,
    experiencePoints: 500,
    badgeId: 'community_regular',
    difficulty: 'hard',
  },
  {
    title: 'Community Pillar',
    description: 'Reach a 30-day streak',
    type: MissionType.ACHIEVEMENT,
    requirement: {
      type: 'daily_checkin',
      count: 30,
    },
    targetCount: 30,
    experiencePoints: 600,
    badgeId: 'monthly_master',
    difficulty: 'hard',
  },
  {
    title: 'Support Network',
    description: 'Help 50 people through likes, votes, and encouragement',
    type: MissionType.ACHIEVEMENT,
    requirement: {
      type: 'help_others',
      count: 50,
    },
    targetCount: 50,
    experiencePoints: 400,
    badgeId: 'supportive_friend',
    difficulty: 'hard',
  },

  // Mental Wellness Focused Missions
  {
    title: 'Self-Reflection',
    description: 'Log your mood for 7 consecutive days',
    type: MissionType.SPECIAL,
    requirement: {
      type: 'daily_checkin',
      count: 7,
    },
    targetCount: 7,
    experiencePoints: 200,
    badgeId: 'self_care_champion',
    difficulty: 'medium',
  },
  {
    title: 'Reach Out',
    description: 'Message 3 friends you haven\'t talked to in a while',
    type: MissionType.SPECIAL,
    requirement: {
      type: 'post',
      count: 3,
    },
    targetCount: 3,
    experiencePoints: 150,
    difficulty: 'medium',
  },
];

/**
 * Mission templates for dynamic generation
 * System can create personalized missions based on user behavior
 */
export const MISSION_TEMPLATES = {
  // Encourage trying new event types
  exploreNewInterests: {
    title: 'Explore New Horizons',
    description: 'Join an event in a category you haven\'t tried yet',
    baseXP: 100,
  },

  // Reconnect with specific friends
  reconnect: {
    title: 'Reconnect',
    description: 'Send a message to {friendName} - you haven\'t talked in {days} days',
    baseXP: 75,
  },

  // Participate in trending events
  trending: {
    title: 'Join the Buzz',
    description: 'Join the trending "{eventName}" event',
    baseXP: 50,
  },

  // Help newcomers feel welcome
  welcomeNewbie: {
    title: 'Welcome Wagon',
    description: 'Help a new user by sending a friendly message or inviting them to an event',
    baseXP: 100,
  },
};
