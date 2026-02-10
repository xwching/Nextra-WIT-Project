import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize services
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  POSTS: 'posts',
  MESSAGES: 'messages',
  CHATS: 'chats',
  BADGES: 'badges',
  MISSIONS: 'missions',
  USER_BADGES: 'userBadges',
  USER_MISSIONS: 'userMissions',
  FRIEND_REQUESTS: 'friendRequests',
  FOLLOWERS: 'followers',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  PARENT_CHILD_LINKS: 'parentChildLinks',
  EVENT_PARTICIPANTS: 'eventParticipants',
  EVENT_MODERATORS: 'eventModerators',
  EVENT_CHATS: 'eventChats',
  EVENT_ENTRIES: 'eventEntries',
  COMMUNITY_EVENTS: 'communityEvents',
  STREAKS: 'streaks',
  MENTAL_WELLNESS_LOGS: 'mentalWellnessLogs',
};

export { app, auth, db, storage, functions };
