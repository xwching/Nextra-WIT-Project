import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
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
const auth = getAuth(app);

const db = getFirestore(app);
const storage = getStorage(app);

// Firestore Collections
export const COLLECTIONS = {
  USERS: "users",
  EVENTS: "events",
  POSTS: "posts",
  MESSAGES: "messages",
  CHATS: "chats",
  BADGES: "badges",
  MISSIONS: "missions",
  USER_BADGES: "userBadges",
  USER_MISSIONS: "userMissions",
  FRIEND_REQUESTS: "friendRequests",
  FOLLOWERS: "followers",
  NOTIFICATIONS: "notifications",
  REPORTS: "reports",
  PARENT_CHILD_LINKS: "parentChildLinks",
  EVENT_PARTICIPANTS: "eventParticipants",
  EVENT_MODERATORS: "eventModerators",
  EVENT_CHATS: "eventChats",
  EVENT_ENTRIES: "eventEntries",
  COMMUNITY_EVENTS: "communityEvents",
  STREAKS: "streaks",
  MENTAL_WELLNESS_LOGS: "mentalWellnessLogs",
  // AI Social Agent collections
  USER_ACTIVITY: "userActivity",
  LONELINESS_SCORES: "lonelinessScores",
  AI_NUDGES: "aiNudges",
  AGENT_MEMORY: "agentMemory",
};

export { app, auth, db, storage };
