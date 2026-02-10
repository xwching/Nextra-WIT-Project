// Mock data for GatherLah app

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  isOnline: boolean;
  mood?: string;
  energyLevel: 'high' | 'medium' | 'low';
  location?: string;
  interests: string[];
  joinedDate: string;
  isFriend?: boolean;
  isFollowing?: boolean;
  isFollower?: boolean;
  isCloseFriend?: boolean;
  currentActivity?: string;
  lastSeen?: string;
  friendsSince?: string;
  mutualFriends?: number;
  eventsAttended?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'creative' | 'tech' | 'games' | 'social' | 'learning' | 'activity' | 'community';
  intensity: 'chill' | 'medium' | 'high';
  duration: 'quick' | 'medium' | 'long';
  host: User;
  startTime: string;
  participants: number;
  maxParticipants: number;
  friendsAttending: User[];
  tags: string[];
  isLive?: boolean;
  location: 'virtual' | 'nearby' | 'anywhere';
}

export interface FriendRequest {
  id: string;
  user: User;
  sentAt: string;
  context?: string;
}

export const currentUser: User = {
  id: 'current',
  username: 'you',
  name: 'You',
  avatar: '👤',
  bio: 'Building meaningful connections',
  isOnline: true,
  mood: '😊',
  energyLevel: 'medium',
  interests: ['coding', 'art', 'gaming', 'reading'],
  joinedDate: '2025-12-01',
};

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'sarah_chen',
    name: 'Sarah Chen',
    avatar: '👩',
    bio: 'Artist & book lover',
    isOnline: true,
    mood: '🎨',
    energyLevel: 'high',
    interests: ['art', 'books', 'coffee'],
    joinedDate: '2025-11-15',
    isFriend: true,
    currentActivity: 'In Drawing Challenge',
    friendsSince: '23 days',
    mutualFriends: 12,
    eventsAttended: 8,
  },
  {
    id: '2',
    username: 'mike_dev',
    name: 'Mike Johnson',
    avatar: '👨‍💻',
    bio: 'Full-stack developer',
    isOnline: false,
    energyLevel: 'medium',
    interests: ['coding', 'gaming', 'hackathons'],
    joinedDate: '2025-10-20',
    isFriend: true,
    lastSeen: '2 hours ago',
    friendsSince: '15 days',
    mutualFriends: 8,
    eventsAttended: 5,
  },
  {
    id: '3',
    username: 'jamie_art',
    name: 'Jamie Lee',
    avatar: '🧑‍🎨',
    bio: 'Creative soul',
    isOnline: true,
    mood: '✨',
    energyLevel: 'medium',
    interests: ['pottery', 'drawing', 'music'],
    joinedDate: '2025-09-10',
    isFriend: true,
    isCloseFriend: true,
    currentActivity: 'Online now',
    friendsSince: '45 days',
    mutualFriends: 15,
    eventsAttended: 12,
  },
  {
    id: '4',
    username: 'alex_fit',
    name: 'Alex Rivera',
    avatar: '🏃',
    bio: 'Fitness enthusiast',
    isOnline: true,
    energyLevel: 'high',
    interests: ['fitness', 'wellness', 'cooking'],
    joinedDate: '2025-11-01',
    isFriend: false,
    isFollowing: true,
    currentActivity: 'Online now',
  },
  {
    id: '5',
    username: 'emma_reads',
    name: 'Emma Watson',
    avatar: '📚',
    bio: 'Bookworm & coffee addict',
    isOnline: false,
    mood: '☕',
    energyLevel: 'low',
    interests: ['reading', 'writing', 'coffee'],
    joinedDate: '2025-10-15',
    isFriend: true,
    lastSeen: '1 day ago',
    friendsSince: '30 days',
    mutualFriends: 10,
    eventsAttended: 6,
  },
  {
    id: '6',
    username: 'chris_game',
    name: 'Chris Park',
    avatar: '🎮',
    bio: 'Gamer & streamer',
    isOnline: true,
    energyLevel: 'high',
    interests: ['gaming', 'tech', 'esports'],
    joinedDate: '2025-11-20',
    isFriend: true,
    currentActivity: 'Online now',
    friendsSince: '7 days',
    mutualFriends: 5,
    eventsAttended: 3,
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Drawing Challenge',
    description: 'Quick sketch session with fun prompts!',
    type: 'creative',
    intensity: 'medium',
    duration: 'quick',
    host: mockUsers[0],
    startTime: new Date(Date.now() + 5 * 60000).toISOString(), // 5 mins
    participants: 8,
    maxParticipants: 15,
    friendsAttending: [mockUsers[0], mockUsers[2]],
    tags: ['art', 'drawing', 'creative'],
    isLive: false,
    location: 'virtual',
  },
  {
    id: '2',
    title: 'Co-working Room',
    description: 'Work together, stay productive!',
    type: 'social',
    intensity: 'chill',
    duration: 'medium',
    host: mockUsers[1],
    startTime: new Date().toISOString(),
    participants: 12,
    maxParticipants: 20,
    friendsAttending: [mockUsers[1], mockUsers[5]],
    tags: ['productivity', 'work', 'focus'],
    isLive: true,
    location: 'virtual',
  },
  {
    id: '3',
    title: 'Hackathon Kickoff',
    description: 'Build something amazing in 24 hours',
    type: 'tech',
    intensity: 'high',
    duration: 'long',
    host: mockUsers[1],
    startTime: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hours
    participants: 24,
    maxParticipants: 50,
    friendsAttending: [mockUsers[1]],
    tags: ['coding', 'hackathon', 'tech'],
    isLive: false,
    location: 'virtual',
  },
  {
    id: '4',
    title: 'Book Club: Sci-Fi Edition',
    description: 'Discussing "Project Hail Mary"',
    type: 'learning',
    intensity: 'chill',
    duration: 'medium',
    host: mockUsers[4],
    startTime: new Date(Date.now() + 24 * 3600000).toISOString(), // tomorrow
    participants: 6,
    maxParticipants: 12,
    friendsAttending: [mockUsers[4]],
    tags: ['books', 'reading', 'discussion'],
    isLive: false,
    location: 'virtual',
  },
  {
    id: '5',
    title: 'Morning Yoga Flow',
    description: 'Start your day with mindful movement',
    type: 'activity',
    intensity: 'medium',
    duration: 'quick',
    host: mockUsers[3],
    startTime: new Date(Date.now() + 12 * 3600000).toISOString(), // tomorrow morning
    participants: 15,
    maxParticipants: 25,
    friendsAttending: [mockUsers[3]],
    tags: ['fitness', 'wellness', 'yoga'],
    isLive: false,
    location: 'virtual',
  },
  {
    id: '6',
    title: 'Trivia Night',
    description: 'Test your knowledge, win glory!',
    type: 'games',
    intensity: 'medium',
    duration: 'medium',
    host: mockUsers[5],
    startTime: new Date(Date.now() + 5 * 3600000).toISOString(), // 5 hours
    participants: 18,
    maxParticipants: 30,
    friendsAttending: [mockUsers[5], mockUsers[0]],
    tags: ['trivia', 'games', 'fun'],
    isLive: false,
    location: 'virtual',
  },
];

export const friendRequests: FriendRequest[] = [
  {
    id: '1',
    user: {
      id: '7',
      username: 'taylor_music',
      name: 'Taylor Swift',
      avatar: '🎵',
      bio: 'Music lover & songwriter',
      isOnline: true,
      energyLevel: 'high',
      interests: ['music', 'writing', 'performing'],
      joinedDate: '2025-11-25',
    },
    sentAt: '2 hours ago',
    context: 'Met at Drawing Challenge event',
  },
  {
    id: '2',
    user: {
      id: '8',
      username: 'jordan_code',
      name: 'Jordan Smith',
      avatar: '💻',
      bio: 'Code enthusiast',
      isOnline: false,
      energyLevel: 'medium',
      interests: ['coding', 'ai', 'learning'],
      joinedDate: '2025-12-01',
    },
    sentAt: '1 day ago',
    context: '3 mutual friends',
  },
  {
    id: '3',
    user: {
      id: '9',
      username: 'riley_photo',
      name: 'Riley Johnson',
      avatar: '📸',
      bio: 'Photographer',
      isOnline: true,
      energyLevel: 'medium',
      interests: ['photography', 'travel', 'art'],
      joinedDate: '2025-11-10',
    },
    sentAt: '3 days ago',
    context: 'Shares interests: Art, Creative',
  },
];

export const qotdAnswers = [
  { user: mockUsers[0], answer: "Coffee, because adulting is hard!", likes: 12 },
  { user: mockUsers[2], answer: "Books! They're my escape from reality.", likes: 8 },
  { user: mockUsers[4], answer: "Music - it speaks when words fail.", likes: 15 },
];

export const friendActivity = [
  { user: mockUsers[0], action: 'joined Book Club', time: '2 hours ago' },
  { user: mockUsers[1], action: 'earned "Conversation Catalyst" badge', time: '3 hours ago' },
  { user: mockUsers[2], action: 'is hosting Drawing Challenge tomorrow', time: '5 hours ago' },
  { user: mockUsers[3], action: 'is looking for co-working buddies now', time: '30 mins ago' },
];

export const badges = [
  { name: 'Social Butterfly', icon: '🦋', description: 'Made 10 friends' },
  { name: 'Event Host', icon: '🎉', description: 'Hosted 5 events' },
  { name: 'Conversation Catalyst', icon: '💬', description: '100 meaningful chats' },
  { name: 'Week Warrior', icon: '🔥', description: '7-day streak' },
];
