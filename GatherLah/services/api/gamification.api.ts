import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase/config';
import {
  Badge,
  UserBadge,
  Mission,
  UserMission,
  Streak,
  XP_REWARDS,
  LEVEL_XP_REQUIREMENTS,
} from '@/types/gamification.types';

export class GamificationAPI {
  /**
   * Award XP to user and handle level ups
   */
  static async awardExperience(userId: string, xpAmount: number, reason: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentXP = userData.experiencePoints || 0;
      const currentLevel = userData.level || 1;
      const newXP = currentXP + xpAmount;

      // Check for level up
      let newLevel = currentLevel;
      while (newLevel < LEVEL_XP_REQUIREMENTS.length && newXP >= LEVEL_XP_REQUIREMENTS[newLevel]) {
        newLevel++;
      }

      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        experiencePoints: newXP,
        level: newLevel,
        updatedAt: serverTimestamp(),
      });

      // If leveled up, create notification and award bonus
      if (newLevel > currentLevel) {
        // TODO: Create level up notification
        // TODO: Award level up bonus rewards
      }
    } catch (error: any) {
      console.error('Award experience error:', error);
      throw new Error(error.message || 'Failed to award experience');
    }
  }

  /**
   * Check and update daily streak
   */
  static async updateStreak(userId: string): Promise<Streak> {
    try {
      const streakDocRef = doc(db, COLLECTIONS.STREAKS, userId);
      const streakDoc = await getDoc(streakDocRef);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (!streakDoc.exists()) {
        // Create new streak
        const newStreak: Streak = {
          id: userId,
          userId: userId,
          currentStreak: 1,
          longestStreak: 1,
          lastCheckInDate: today,
          streakStartDate: today,
          milestones: [],
          updatedAt: today,
        };

        await setDoc(streakDocRef, {
          ...newStreak,
          lastCheckInDate: serverTimestamp(),
          streakStartDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Award XP for daily check-in
        await this.awardExperience(userId, XP_REWARDS.DAILY_CHECKIN, 'Daily check-in');

        return newStreak;
      }

      const streak = streakDoc.data() as Streak;
      const lastCheckIn = streak.lastCheckInDate.toDate();
      const lastCheckInDay = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate());

      // Check if already checked in today
      if (lastCheckInDay.getTime() === today.getTime()) {
        return streak;
      }

      // Check if streak continues (yesterday) or breaks
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newCurrentStreak = 1;
      let newStreakStartDate = today;

      if (lastCheckInDay.getTime() === yesterday.getTime()) {
        // Streak continues
        newCurrentStreak = streak.currentStreak + 1;
        newStreakStartDate = streak.streakStartDate;
      } else {
        // Streak broken
        newCurrentStreak = 1;
        newStreakStartDate = today;
      }

      const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

      // Check for milestone
      const milestones = [7, 14, 30, 60, 100, 365];
      const newMilestones = [...streak.milestones];
      for (const milestone of milestones) {
        if (newCurrentStreak === milestone && !newMilestones.includes(milestone)) {
          newMilestones.push(milestone);
          // TODO: Award milestone badge
          // TODO: Create milestone notification
        }
      }

      const updatedStreak: Streak = {
        ...streak,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: today,
        streakStartDate: newStreakStartDate,
        milestones: newMilestones,
        updatedAt: today,
      };

      await updateDoc(streakDocRef, {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: serverTimestamp(),
        streakStartDate: newStreakStartDate,
        milestones: newMilestones,
        updatedAt: serverTimestamp(),
      });

      // Update user document
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      });

      // Award XP
      await this.awardExperience(userId, XP_REWARDS.DAILY_CHECKIN + XP_REWARDS.STREAK_DAY, 'Daily streak');

      return updatedStreak;
    } catch (error: any) {
      console.error('Update streak error:', error);
      throw new Error(error.message || 'Failed to update streak');
    }
  }

  /**
   * Award badge to user
   */
  static async awardBadge(userId: string, badgeId: string): Promise<void> {
    try {
      // Check if already has badge
      const existingBadgeQuery = query(
        collection(db, COLLECTIONS.USER_BADGES),
        where('userId', '==', userId),
        where('badgeId', '==', badgeId)
      );
      const existingBadges = await getDocs(existingBadgeQuery);
      if (!existingBadges.empty) {
        return; // Already has badge
      }

      const badgeDoc = await getDoc(doc(db, COLLECTIONS.BADGES, badgeId));
      if (!badgeDoc.exists()) {
        throw new Error('Badge not found');
      }

      const badge = badgeDoc.data() as Badge;

      const userBadgeId = doc(collection(db, COLLECTIONS.USER_BADGES)).id;
      const userBadge: UserBadge = {
        id: userBadgeId,
        userId: userId,
        badgeId: badgeId,
        earnedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.USER_BADGES, userBadgeId), {
        ...userBadge,
        earnedAt: serverTimestamp(),
      });

      // Award XP
      await this.awardExperience(userId, badge.experiencePoints, `Earned ${badge.name} badge`);

      // TODO: Create notification
    } catch (error: any) {
      console.error('Award badge error:', error);
      throw new Error(error.message || 'Failed to award badge');
    }
  }

  /**
   * Update mission progress
   */
  static async updateMissionProgress(
    userId: string,
    missionType: string,
    progressIncrement: number = 1
  ): Promise<void> {
    try {
      // Get active missions of this type
      const missionsQuery = query(
        collection(db, COLLECTIONS.MISSIONS),
        where('requirement.type', '==', missionType)
      );
      const missionsDocs = await getDocs(missionsQuery);

      for (const missionDoc of missionsDocs.docs) {
        const mission = { id: missionDoc.id, ...missionDoc.data() } as Mission;

        // Get user mission progress
        const userMissionQuery = query(
          collection(db, COLLECTIONS.USER_MISSIONS),
          where('userId', '==', userId),
          where('missionId', '==', mission.id),
          where('isCompleted', '==', false)
        );
        const userMissionDocs = await getDocs(userMissionQuery);

        if (userMissionDocs.empty) {
          // Create new user mission
          const userMissionId = doc(collection(db, COLLECTIONS.USER_MISSIONS)).id;
          const userMission: UserMission = {
            id: userMissionId,
            userId: userId,
            missionId: mission.id,
            progress: progressIncrement,
            isCompleted: progressIncrement >= mission.targetCount,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await setDoc(doc(db, COLLECTIONS.USER_MISSIONS, userMissionId), {
            ...userMission,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (userMission.isCompleted) {
            await this.completeMission(userId, mission);
          }
        } else {
          // Update existing mission
          const userMissionDoc = userMissionDocs.docs[0];
          const userMission = userMissionDoc.data() as UserMission;
          const newProgress = userMission.progress + progressIncrement;
          const isCompleted = newProgress >= mission.targetCount;

          await updateDoc(userMissionDoc.ref, {
            progress: newProgress,
            isCompleted: isCompleted,
            completedAt: isCompleted ? serverTimestamp() : null,
            updatedAt: serverTimestamp(),
          });

          if (isCompleted && !userMission.isCompleted) {
            await this.completeMission(userId, mission);
          }
        }
      }
    } catch (error: any) {
      console.error('Update mission progress error:', error);
      throw new Error(error.message || 'Failed to update mission progress');
    }
  }

  /**
   * Complete mission and award rewards
   */
  private static async completeMission(userId: string, mission: Mission): Promise<void> {
    try {
      // Award XP
      await this.awardExperience(userId, mission.experiencePoints, `Completed ${mission.title}`);

      // Award badge if applicable
      if (mission.badgeId) {
        await this.awardBadge(userId, mission.badgeId);
      }

      // TODO: Create completion notification
    } catch (error: any) {
      console.error('Complete mission error:', error);
      throw new Error(error.message || 'Failed to complete mission');
    }
  }

  /**
   * Get user's active missions
   */
  static async getUserMissions(userId: string): Promise<UserMission[]> {
    try {
      const userMissionsQuery = query(
        collection(db, COLLECTIONS.USER_MISSIONS),
        where('userId', '==', userId),
        where('isCompleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      const userMissionsDocs = await getDocs(userMissionsQuery);

      return userMissionsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserMission));
    } catch (error: any) {
      console.error('Get user missions error:', error);
      throw new Error(error.message || 'Failed to get user missions');
    }
  }

  /**
   * Get user's earned badges
   */
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const userBadgesQuery = query(
        collection(db, COLLECTIONS.USER_BADGES),
        where('userId', '==', userId),
        orderBy('earnedAt', 'desc')
      );
      const userBadgesDocs = await getDocs(userBadgesQuery);

      return userBadgesDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserBadge));
    } catch (error: any) {
      console.error('Get user badges error:', error);
      throw new Error(error.message || 'Failed to get user badges');
    }
  }
}

export default GamificationAPI;
