import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from './config';
import { User, AccountType, ParentChildLink } from '@/types/user.types';

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(
    email: string,
    password: string,
    username: string,
    displayName: string,
    accountType: AccountType = AccountType.NORMAL,
    dateOfBirth?: Date
  ): Promise<User> {
    try {
      // Check if user is under 13 for child account
      const isUnder13 = dateOfBirth && this.calculateAge(dateOfBirth) < 13;
      if (isUnder13 && accountType !== AccountType.CHILD) {
        throw new Error('Users under 13 must have a parent account setup');
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: email,
        username: username,
        displayName: displayName,
        avatar: this.generateDefaultAvatar(username),
        bio: '',
        accountType: accountType,
        dateOfBirth: dateOfBirth,
        interests: [],
        friendsCount: 0,
        followersCount: 0,
        followingCount: 0,
        level: 1,
        experiencePoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalEventsJoined: 0,
        totalEventsCreated: 0,
        moodHistory: [],
        wellnessScore: 100,
        isOnline: true,
        lastSeen: new Date(),
        notificationSettings: this.getDefaultNotificationSettings(),
        privacySettings: this.getDefaultPrivacySettings(accountType),
        createdAt: new Date(),
        updatedAt: new Date(),
        isKidFriendlyOnly: accountType === AccountType.CHILD,
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return newUser;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  /**
   * Link child account to parent
   */
  static async linkChildToParent(
    childUserId: string,
    parentUserId: string,
    allowedEventTypes: string[] = [],
    screenTimeLimit?: number
  ): Promise<void> {
    try {
      // Verify parent account type
      const parentDoc = await getDoc(doc(db, COLLECTIONS.USERS, parentUserId));
      if (!parentDoc.exists() || parentDoc.data()?.accountType !== AccountType.PARENT) {
        throw new Error('Parent account not found or invalid account type');
      }

      // Verify child account
      const childDoc = await getDoc(doc(db, COLLECTIONS.USERS, childUserId));
      if (!childDoc.exists() || childDoc.data()?.accountType !== AccountType.CHILD) {
        throw new Error('Child account not found or invalid account type');
      }

      // Create parent-child link
      const linkId = `${parentUserId}_${childUserId}`;
      const link: ParentChildLink = {
        id: linkId,
        parentId: parentUserId,
        childId: childUserId,
        monitoringEnabled: true,
        allowedEventTypes: allowedEventTypes,
        screenTimeLimit: screenTimeLimit,
        createdAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.PARENT_CHILD_LINKS, linkId), {
        ...link,
        createdAt: serverTimestamp(),
      });

      // Update parent's child IDs
      await updateDoc(doc(db, COLLECTIONS.USERS, parentUserId), {
        childIds: [...(parentDoc.data()?.childIds || []), childUserId],
        updatedAt: serverTimestamp(),
      });

      // Update child's parent ID
      await updateDoc(doc(db, COLLECTIONS.USERS, childUserId), {
        parentId: parentUserId,
        isKidFriendlyOnly: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Link child error:', error);
      throw new Error(error.message || 'Failed to link child account');
    }
  }

  /**
   * Sign in existing user
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update online status
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        isOnline: true,
        lastSeen: serverTimestamp(),
      });

      // Get user data
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      return { id: firebaseUser.uid, ...userDoc.data() } as User;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  /**
   * Sign out user
   */
  static async signOut(userId: string): Promise<void> {
    try {
      // Update online status
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });

      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Get parent monitoring data for child account
   */
  static async getChildActivityData(parentId: string, childId: string): Promise<any> {
    try {
      // Verify parent-child link
      const linkDoc = await getDoc(doc(db, COLLECTIONS.PARENT_CHILD_LINKS, `${parentId}_${childId}`));
      if (!linkDoc.exists()) {
        throw new Error('Parent-child link not found');
      }

      const childDoc = await getDoc(doc(db, COLLECTIONS.USERS, childId));
      if (!childDoc.exists()) {
        throw new Error('Child account not found');
      }

      const childData = childDoc.data() as User;

      return {
        profile: {
          username: childData.username,
          level: childData.level,
          currentStreak: childData.currentStreak,
        },
        joinedEvents: childData.totalEventsJoined,
        friendsCount: childData.friendsCount,
        recentActivity: [], // TODO: Fetch from activity log
        screenTime: 0, // TODO: Calculate from activity log
      };
    } catch (error: any) {
      console.error('Get child activity error:', error);
      throw new Error(error.message || 'Failed to get child activity');
    }
  }

  // Helper methods
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private static generateDefaultAvatar(username: string): string {
    const emojis = ['😊', '🎨', '🎮', '🌟', '🚀', '🎭', '🎪', '🎯', '💫', '🌈'];
    const index = username.charCodeAt(0) % emojis.length;
    return emojis[index];
  }

  private static getDefaultNotificationSettings() {
    return {
      friendRequests: true,
      eventInvites: true,
      eventUpdates: true,
      messages: true,
      friendActivity: true,
      badges: true,
      missions: true,
      communityEvents: true,
      dailyReminders: true,
    };
  }

  private static getDefaultPrivacySettings(accountType: AccountType) {
    const isChild = accountType === AccountType.CHILD;
    return {
      profileVisibility: isChild ? ('friends' as const) : ('public' as const),
      showOnlineStatus: !isChild,
      showActivity: !isChild,
      allowFriendRequests: isChild ? ('none' as const) : ('everyone' as const),
      showLocation: false,
    };
  }
}

export default AuthService;
