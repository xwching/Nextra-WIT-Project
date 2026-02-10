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
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase/config';
import { Notification, NotificationType } from '@/types/social.types';

export class NotificationsAPI {
  /**
   * Create a notification
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedUserId?: string,
    relatedEventId?: string,
    relatedPostId?: string,
    actionUrl?: string
  ): Promise<Notification> {
    try {
      // Check user's notification settings
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const settings = userData.notificationSettings;

      // Check if this notification type is enabled
      if (!this.isNotificationEnabled(type, settings)) {
        return null as any; // Don't create notification if disabled
      }

      const notificationId = doc(collection(db, COLLECTIONS.NOTIFICATIONS)).id;

      const notification: Notification = {
        id: notificationId,
        userId: userId,
        type: type,
        title: title,
        message: message,
        relatedUserId: relatedUserId,
        relatedEventId: relatedEventId,
        relatedPostId: relatedPostId,
        actionUrl: actionUrl,
        isRead: false,
        createdAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        ...notification,
        createdAt: serverTimestamp(),
      });

      // TODO: Send push notification if enabled

      return notification;
    } catch (error: any) {
      console.error('Create notification error:', error);
      throw new Error(error.message || 'Failed to create notification');
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        isRead: true,
        readAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsQuery = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const notificationsDocs = await getDocs(notificationsQuery);

      const updatePromises = notificationsDocs.docs.map(doc =>
        updateDoc(doc.ref, {
          isRead: true,
          readAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    limitCount: number = 50,
    onlyUnread: boolean = false
  ): Promise<Notification[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId)
      );

      if (onlyUnread) {
        q = query(q, where('isRead', '==', false));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

      const notificationsDocs = await getDocs(q);
      return notificationsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw new Error(error.message || 'Failed to get notifications');
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const notificationsDocs = await getDocs(q);
      return notificationsDocs.size;
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // Helper: Check if notification type is enabled in settings
  private static isNotificationEnabled(type: NotificationType, settings: any): boolean {
    const typeToSettingMap: { [key in NotificationType]: string } = {
      [NotificationType.FRIEND_REQUEST]: 'friendRequests',
      [NotificationType.FRIEND_ACCEPTED]: 'friendRequests',
      [NotificationType.NEW_FOLLOWER]: 'friendActivity',
      [NotificationType.EVENT_INVITE]: 'eventInvites',
      [NotificationType.EVENT_REMINDER]: 'eventUpdates',
      [NotificationType.EVENT_STARTING]: 'eventUpdates',
      [NotificationType.EVENT_CANCELLED]: 'eventUpdates',
      [NotificationType.NEW_MESSAGE]: 'messages',
      [NotificationType.POST_LIKE]: 'friendActivity',
      [NotificationType.POST_REPLY]: 'friendActivity',
      [NotificationType.ENTRY_VOTE]: 'friendActivity',
      [NotificationType.BADGE_EARNED]: 'badges',
      [NotificationType.MISSION_COMPLETED]: 'missions',
      [NotificationType.LEVEL_UP]: 'badges',
      [NotificationType.STREAK_MILESTONE]: 'badges',
      [NotificationType.FRIEND_ACTIVITY]: 'friendActivity',
      [NotificationType.DAILY_REMINDER]: 'dailyReminders',
      [NotificationType.WELLNESS_CHECK]: 'dailyReminders',
    };

    const settingKey = typeToSettingMap[type];
    return settings?.[settingKey] !== false;
  }

  /**
   * Create specific notification types
   */
  static async notifyFriendRequest(receiverId: string, senderId: string): Promise<void> {
    const senderDoc = await getDoc(doc(db, COLLECTIONS.USERS, senderId));
    const senderName = senderDoc.data()?.displayName || 'Someone';

    await this.createNotification(
      receiverId,
      NotificationType.FRIEND_REQUEST,
      'New Friend Request',
      `${senderName} sent you a friend request`,
      senderId,
      undefined,
      undefined,
      `/friends/requests`
    );
  }

  static async notifyEventInvite(userId: string, eventId: string, inviterId: string): Promise<void> {
    const inviterDoc = await getDoc(doc(db, COLLECTIONS.USERS, inviterId));
    const inviterName = inviterDoc.data()?.displayName || 'Someone';
    const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
    const eventTitle = eventDoc.data()?.title || 'an event';

    await this.createNotification(
      userId,
      NotificationType.EVENT_INVITE,
      'Event Invitation',
      `${inviterName} invited you to ${eventTitle}`,
      inviterId,
      eventId,
      undefined,
      `/event/${eventId}`
    );
  }

  static async notifyBadgeEarned(userId: string, badgeName: string, badgeId: string): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.BADGE_EARNED,
      'Badge Earned! 🎉',
      `You've earned the "${badgeName}" badge!`,
      undefined,
      undefined,
      undefined,
      `/profile/badges`
    );
  }

  static async notifyLevelUp(userId: string, newLevel: number): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.LEVEL_UP,
      'Level Up! 🚀',
      `Congratulations! You've reached Level ${newLevel}`,
      undefined,
      undefined,
      undefined,
      `/profile`
    );
  }
}

export default NotificationsAPI;
