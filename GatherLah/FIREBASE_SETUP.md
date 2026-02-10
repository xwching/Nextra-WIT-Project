# 🔥 Firebase Setup Guide for GatherLah

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `GatherLah`
4. Enable/Disable Google Analytics (your choice)
5. Click **"Create project"**

---

## Step 2: Register Web App

1. In Firebase dashboard, click **Web icon** (`</>`)
2. Enter app nickname: `GatherLah App`
3. Click **"Register app"**
4. **Copy the configuration values** (you'll need these for Step 5)

---

## Step 3: Enable Firebase Services

### 3a. Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get started"**
3. Enable these sign-in methods:
   - ✅ **Email/Password** (Required)
   - ✅ **Google** (Optional but recommended)
   - ✅ **Anonymous** (Optional for testing)

### 3b. Create Firestore Database

1. Go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select your preferred location (closest to your users)
5. Click **"Enable"**

### 3c. Enable Storage

1. Go to **Build → Storage**
2. Click **"Get started"**
3. Start in **test mode**
4. Click **"Done"**

### 3d. Enable Cloud Functions (Optional for now)

1. Go to **Build → Functions**
2. Click **"Get started"**
3. Follow setup instructions (you can do this later)

---

## Step 4: Install Required Packages

Run these commands in your terminal:

```bash
cd GatherLah

# Install Firebase packages
npm install firebase

# Install AsyncStorage for persistence
npm install @react-native-async-storage/async-storage

# Install additional dependencies if not already installed
npm install expo-linear-gradient react-native-svg
```

---

## Step 5: Configure Environment Variables

1. Open the `.env` file in your project root (already created)
2. Replace the placeholder values with your Firebase config:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=gatherlah-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=gatherlah-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=gatherlah-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Important:**
- ✅ Use `EXPO_PUBLIC_` prefix for all Firebase env variables
- ✅ Never commit `.env` file to Git (already in `.gitignore`)

---

## Step 6: Test the Connection

Create a test file to verify Firebase is working:

```typescript
// Test in any screen or create a test file
import { db, auth } from '@/services/firebase/config';

// Test Firestore connection
console.log('Firebase initialized:', db ? 'Yes' : 'No');
console.log('Auth initialized:', auth ? 'Yes' : 'No');
```

---

## Step 7: Set Up Firestore Security Rules

1. Go to **Firestore Database → Rules**
2. Replace the default rules with these (for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isChildAccount() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accountType == 'child';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);

      // Sub-collections
      match /friends/{friendId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Events collection
    match /events/{eventId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        resource.data.creatorId == request.auth.uid ||
        request.auth.uid in resource.data.moderatorIds
      );
      allow delete: if isSignedIn() && resource.data.creatorId == request.auth.uid;
    }

    // Event participants
    match /eventParticipants/{participantId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Event chats
    match /eventChats/{chatId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && (
        resource.data.creatorId == request.auth.uid ||
        request.auth.uid in resource.data.moderatorIds
      );
    }

    // Posts
    match /posts/{postId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.authorId);
    }

    // Messages
    match /messages/{messageId} {
      allow read: if isSignedIn() && (
        request.auth.uid == resource.data.senderId ||
        request.auth.uid == resource.data.receiverId
      );
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.senderId;
      allow update, delete: if isOwner(resource.data.senderId);
    }

    // Conversations/Chats
    match /chats/{chatId} {
      allow read: if isSignedIn() && request.auth.uid in resource.data.participantIds;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && request.auth.uid in resource.data.participantIds;
    }

    // Friend requests
    match /friendRequests/{requestId} {
      allow read: if isSignedIn() && (
        request.auth.uid == resource.data.senderId ||
        request.auth.uid == resource.data.receiverId
      );
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.senderId;
      allow update: if isSignedIn() && request.auth.uid == resource.data.receiverId;
    }

    // Followers
    match /followers/{followId} {
      allow read: if isSignedIn();
      allow create, delete: if isSignedIn() && request.auth.uid == resource.data.followerId;
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow update: if isOwner(resource.data.userId);
    }

    // Badges (read-only for users)
    match /badges/{badgeId} {
      allow read: if isSignedIn();
    }

    // User badges
    match /userBadges/{userBadgeId} {
      allow read: if isSignedIn();
    }

    // Missions (read-only for users)
    match /missions/{missionId} {
      allow read: if isSignedIn();
    }

    // User missions
    match /userMissions/{userMissionId} {
      allow read: if isSignedIn();
    }

    // Streaks
    match /streaks/{userId} {
      allow read: if isOwner(userId);
    }

    // Parent-child links
    match /parentChildLinks/{linkId} {
      allow read: if isSignedIn() && (
        request.auth.uid == resource.data.parentId ||
        request.auth.uid == resource.data.childId
      );
      allow create: if isSignedIn();
    }

    // Reports (users can create, admins can read all)
    match /reports/{reportId} {
      allow read: if isOwner(resource.data.reporterId);
      allow create: if isSignedIn();
    }

    // Mental wellness logs
    match /mentalWellnessLogs/{logId} {
      allow read, write: if isOwner(resource.data.userId);
    }
  }
}
```

3. Click **"Publish"**

---

## Step 8: Set Up Storage Rules

1. Go to **Storage → Rules**
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    // User avatars
    match /avatars/{userId}/{fileName} {
      allow read: if true; // Public read
      allow write: if isSignedIn() && request.auth.uid == userId;
    }

    // Event images
    match /events/{eventId}/{fileName} {
      allow read: if true; // Public read
      allow write: if isSignedIn();
    }

    // Competition entries
    match /entries/{entryId}/{fileName} {
      allow read: if true; // Public read
      allow write: if isSignedIn();
    }

    // Post images
    match /posts/{postId}/{fileName} {
      allow read: if true; // Public read
      allow write: if isSignedIn();
    }
  }
}
```

3. Click **"Publish"**

---

## Step 9: Initialize Sample Data (Optional)

You can run a script to populate initial badges and missions:

```typescript
// Create a script: scripts/initializeData.ts
import { collection, addDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase/config';
import { INITIAL_BADGES } from '@/services/data/initial-badges';
import { INITIAL_MISSIONS } from '@/services/data/initial-missions';

async function initializeData() {
  console.log('Initializing badges...');
  for (const badge of INITIAL_BADGES) {
    await addDoc(collection(db, COLLECTIONS.BADGES), {
      ...badge,
      createdAt: new Date(),
    });
  }

  console.log('Initializing missions...');
  for (const mission of INITIAL_MISSIONS) {
    await addDoc(collection(db, COLLECTIONS.MISSIONS), {
      ...mission,
      createdAt: new Date(),
    });
  }

  console.log('Data initialized successfully!');
}

// Run this once
initializeData();
```

---

## Step 10: Test Your Setup

Try signing up a user:

```typescript
import { AuthService } from '@/services';

// Test signup
try {
  const user = await AuthService.signUp(
    'test@example.com',
    'password123',
    'testuser',
    'Test User',
    AccountType.NORMAL
  );
  console.log('User created:', user);
} catch (error) {
  console.error('Error:', error);
}
```

---

## 🎉 You're All Set!

Your Firebase backend is now configured and ready to use with GatherLah!

### Next Steps:
1. ✅ Test authentication (sign up, login)
2. ✅ Create some test events
3. ✅ Test friend requests
4. ✅ Check daily streak functionality
5. ✅ Award some badges

### Useful Commands:
```bash
# Start the app
npm start

# Clear cache if issues
npm start -- --clear

# View Firebase data
# Go to Firebase Console → Firestore Database
```

### Need Help?
- Firebase Docs: https://firebase.google.com/docs
- Expo Docs: https://docs.expo.dev
- GatherLah Backend README: See `services/README.md`

---

**Built with ❤️ to combat social isolation!**
