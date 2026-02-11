import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  or,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase/config';
import {
  FriendRequest,
  FriendRequestStatus,
  Friendship,
  Follow,
  Message,
  Conversation,
} from '@/types/social.types';
import { User } from '@/types/user.types';

export class FriendsAPI {
  /**
   * Send friend request
   */
  static async sendFriendRequest(
    senderId: string,
    receiverId: string,
    message?: string,
    context?: string
  ): Promise<FriendRequest> {
    try {
      // Check if already friends
      const existingFriendship = await this.getFriendship(senderId, receiverId);
      if (existingFriendship) {
        throw new Error('Already friends');
      }

      // Check for existing pending request
      const existingRequestQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('senderId', '==', senderId),
        where('receiverId', '==', receiverId),
        where('status', '==', FriendRequestStatus.PENDING)
      );
      const existingRequests = await getDocs(existingRequestQuery);
      if (!existingRequests.empty) {
        throw new Error('Friend request already sent');
      }

      // Check receiver's privacy settings
      const receiverDoc = await getDoc(doc(db, COLLECTIONS.USERS, receiverId));
      const receiverData = receiverDoc.data() as User;
      if (receiverData?.privacySettings?.allowFriendRequests === 'none') {
        throw new Error('This user is not accepting friend requests');
      }

      const requestId = doc(collection(db, COLLECTIONS.FRIEND_REQUESTS)).id;

      const request: Record<string, any> = {
        id: requestId,
        senderId: senderId,
        receiverId: receiverId,
        status: FriendRequestStatus.PENDING,
        createdAt: new Date(),
      };
      if (message) request.message = message;
      if (context) request.context = context;

      await setDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId), {
        ...request,
        createdAt: serverTimestamp(),
      });

      // Create notification
      // TODO: Call notifications service

      return request as unknown as FriendRequest;
    } catch (error: any) {
      console.error('Send friend request error:', error);
      throw new Error(error.message || 'Failed to send friend request');
    }
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      const requestDoc = await getDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId));
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const request = requestDoc.data() as FriendRequest;
      if (request.status !== FriendRequestStatus.PENDING) {
        throw new Error('Friend request already processed');
      }

      // Update request status
      await updateDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId), {
        status: FriendRequestStatus.ACCEPTED,
        respondedAt: serverTimestamp(),
      });

      // Create friendship
      const friendshipId = doc(collection(db, COLLECTIONS.USERS)).id;
      const friendship: Friendship = {
        id: friendshipId,
        userId1: request.senderId,
        userId2: request.receiverId,
        isCloseFriend: false,
        createdAt: new Date(),
      };

      await setDoc(doc(db, `${COLLECTIONS.USERS}/${request.senderId}/friends`, friendshipId), {
        ...friendship,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, `${COLLECTIONS.USERS}/${request.receiverId}/friends`, friendshipId), {
        ...friendship,
        createdAt: serverTimestamp(),
      });

      // Update friend counts
      await updateDoc(doc(db, COLLECTIONS.USERS, request.senderId), {
        friendsCount: increment(1),
        experiencePoints: increment(20), // XP for making friend
      });
      await updateDoc(doc(db, COLLECTIONS.USERS, request.receiverId), {
        friendsCount: increment(1),
        experiencePoints: increment(20),
      });

      // Create notification
      // TODO: Call notifications service
    } catch (error: any) {
      console.error('Accept friend request error:', error);
      throw new Error(error.message || 'Failed to accept friend request');
    }
  }

  /**
   * Reject friend request
   */
  static async rejectFriendRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId), {
        status: FriendRequestStatus.REJECTED,
        respondedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Reject friend request error:', error);
      throw new Error(error.message || 'Failed to reject friend request');
    }
  }

  /**
   * Remove friend
   */
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const friendship = await this.getFriendship(userId, friendId);
      if (!friendship) {
        throw new Error('Not friends');
      }

      // Delete friendship documents
      await deleteDoc(doc(db, `${COLLECTIONS.USERS}/${userId}/friends`, friendship.id));
      await deleteDoc(doc(db, `${COLLECTIONS.USERS}/${friendId}/friends`, friendship.id));

      // Update friend counts
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        friendsCount: increment(-1),
      });
      await updateDoc(doc(db, COLLECTIONS.USERS, friendId), {
        friendsCount: increment(-1),
      });
    } catch (error: any) {
      console.error('Remove friend error:', error);
      throw new Error(error.message || 'Failed to remove friend');
    }
  }

  /**
   * Follow user
   */
  static async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Check if already following
      const existingFollowQuery = query(
        collection(db, COLLECTIONS.FOLLOWERS),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );
      const existingFollows = await getDocs(existingFollowQuery);
      if (!existingFollows.empty) {
        throw new Error('Already following');
      }

      const followId = doc(collection(db, COLLECTIONS.FOLLOWERS)).id;
      const follow: Follow = {
        id: followId,
        followerId: followerId,
        followingId: followingId,
        createdAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.FOLLOWERS, followId), {
        ...follow,
        createdAt: serverTimestamp(),
      });

      // Update counts
      await updateDoc(doc(db, COLLECTIONS.USERS, followerId), {
        followingCount: increment(1),
      });
      await updateDoc(doc(db, COLLECTIONS.USERS, followingId), {
        followersCount: increment(1),
      });

      // Create notification
      // TODO: Call notifications service
    } catch (error: any) {
      console.error('Follow user error:', error);
      throw new Error(error.message || 'Failed to follow user');
    }
  }

  /**
   * Unfollow user
   */
  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      const followQuery = query(
        collection(db, COLLECTIONS.FOLLOWERS),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );
      const followDocs = await getDocs(followQuery);
      if (followDocs.empty) {
        throw new Error('Not following');
      }

      await deleteDoc(followDocs.docs[0].ref);

      // Update counts
      await updateDoc(doc(db, COLLECTIONS.USERS, followerId), {
        followingCount: increment(-1),
      });
      await updateDoc(doc(db, COLLECTIONS.USERS, followingId), {
        followersCount: increment(-1),
      });
    } catch (error: any) {
      console.error('Unfollow user error:', error);
      throw new Error(error.message || 'Failed to unfollow user');
    }
  }

  /**
   * Get sent (outgoing) pending friend requests
   */
  static async getSentRequests(userId: string): Promise<(FriendRequest & { receiverUser?: User })[]> {
    try {
      const sentQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('senderId', '==', userId),
        where('status', '==', FriendRequestStatus.PENDING)
      );
      const snap = await getDocs(sentQuery);
      const results: (FriendRequest & { receiverUser?: User })[] = [];
      for (const d of snap.docs) {
        const req = { id: d.id, ...d.data() } as FriendRequest;
        const receiverDoc = await getDoc(doc(db, COLLECTIONS.USERS, req.receiverId));
        if (receiverDoc.exists()) {
          results.push({ ...req, receiverUser: { id: receiverDoc.id, ...receiverDoc.data() } as User });
        } else {
          results.push(req);
        }
      }
      return results;
    } catch (error: any) {
      console.error('Get sent requests error:', error);
      throw new Error(error.message || 'Failed to get sent requests');
    }
  }

  /**
   * Cancel a sent friend request
   */
  static async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId));
    } catch (error: any) {
      console.error('Cancel friend request error:', error);
      throw new Error(error.message || 'Failed to cancel friend request');
    }
  }

  /**
   * Get friend suggestions based on mutual friends and shared interests
   */
  static async getFriendSuggestions(userId: string, limitCount: number = 10): Promise<(User & { mutualCount?: number; sharedInterests?: string[] })[]> {
    try {
      // Get user's current friends
      const friendsSnap = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/friends`));
      const friendIds = friendsSnap.docs.map(d => {
        const friendship = d.data() as Friendship;
        return friendship.userId1 === userId ? friendship.userId2 : friendship.userId1;
      });

      // Get pending request user IDs (both sent and received) to exclude
      const sentQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('senderId', '==', userId),
        where('status', '==', FriendRequestStatus.PENDING)
      );
      const receivedQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('receiverId', '==', userId),
        where('status', '==', FriendRequestStatus.PENDING)
      );
      const [sentSnap, receivedSnap] = await Promise.all([getDocs(sentQuery), getDocs(receivedQuery)]);
      const pendingIds = new Set<string>();
      sentSnap.docs.forEach(d => pendingIds.add(d.data().receiverId));
      receivedSnap.docs.forEach(d => pendingIds.add(d.data().senderId));

      const excludeIds = new Set([userId, ...friendIds, ...pendingIds]);

      // Get user data for interests
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      const userData = userDoc.data() as User;
      const userInterests = userData?.interests || [];

      let candidateDocs: any[] = [];

      // If user has interests, find users with shared interests
      if (userInterests.length > 0) {
        const suggestionsQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('interests', 'array-contains-any', userInterests.slice(0, 10)),
          limit(limitCount * 3)
        );
        const snap = await getDocs(suggestionsQuery);
        candidateDocs = snap.docs;
      }

      // Fallback: if not enough results, fetch recent users
      if (candidateDocs.length < limitCount) {
        const fallbackQuery = query(
          collection(db, COLLECTIONS.USERS),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 3)
        );
        const fallbackSnap = await getDocs(fallbackQuery);
        const existingIds = new Set(candidateDocs.map((d: any) => d.id));
        for (const d of fallbackSnap.docs) {
          if (!existingIds.has(d.id)) {
            candidateDocs.push(d);
          }
        }
      }

      // Build suggestions with mutual friend count and shared interests
      const suggestions: (User & { mutualCount?: number; sharedInterests?: string[] })[] = [];

      for (const d of candidateDocs) {
        if (excludeIds.has(d.id)) continue;
        if (suggestions.length >= limitCount) break;

        const u = { id: d.id, ...d.data() } as User;

        // Calculate shared interests
        const shared = (u.interests || []).filter((i: string) => userInterests.includes(i));

        // Count mutual friends
        let mutualCount = 0;
        if (friendIds.length > 0) {
          const theirFriendsSnap = await getDocs(collection(db, `${COLLECTIONS.USERS}/${u.id}/friends`));
          const theirFriendIds = theirFriendsSnap.docs.map(fd => {
            const f = fd.data() as Friendship;
            return f.userId1 === u.id ? f.userId2 : f.userId1;
          });
          mutualCount = theirFriendIds.filter(id => friendIds.includes(id)).length;
        }

        suggestions.push({ ...u, mutualCount, sharedInterests: shared });
      }

      // Sort: mutual friends first, then shared interests count
      suggestions.sort((a, b) => {
        if ((b.mutualCount || 0) !== (a.mutualCount || 0)) return (b.mutualCount || 0) - (a.mutualCount || 0);
        return (b.sharedInterests?.length || 0) - (a.sharedInterests?.length || 0);
      });

      return suggestions;
    } catch (error: any) {
      console.error('Get friend suggestions error:', error);
      throw new Error(error.message || 'Failed to get friend suggestions');
    }
  }

  /**
   * Send direct message
   */
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: 'text' | 'image' | 'event-invite' | 'friend-request' = 'text',
    metadata?: any
  ): Promise<Message> {
    try {
      // Get or create conversation
      const conversationId = await this.getOrCreateConversation(senderId, receiverId);

      const messageId = doc(collection(db, COLLECTIONS.MESSAGES)).id;
      const message: Message = {
        id: messageId,
        conversationId: conversationId,
        senderId: senderId,
        receiverId: receiverId,
        content: content,
        type: type,
        isRead: false,
        createdAt: new Date(),
        ...metadata,
      };

      await setDoc(doc(db, COLLECTIONS.MESSAGES, messageId), {
        ...message,
        createdAt: serverTimestamp(),
      });

      // Update conversation
      await updateDoc(doc(db, COLLECTIONS.CHATS, conversationId), {
        lastMessage: message,
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp(),
      });

      return message;
    } catch (error: any) {
      console.error('Send message error:', error);
      throw new Error(error.message || 'Failed to send message');
    }
  }

  // Helper methods
  private static async getFriendship(userId1: string, userId2: string): Promise<Friendship | null> {
    const friendsQuery = query(
      collection(db, `${COLLECTIONS.USERS}/${userId1}/friends`),
      or(
        where('userId1', '==', userId2),
        where('userId2', '==', userId2)
      )
    );
    const friendsDocs = await getDocs(friendsQuery);
    if (friendsDocs.empty) return null;
    return { id: friendsDocs.docs[0].id, ...friendsDocs.docs[0].data() } as Friendship;
  }

  private static async getOrCreateConversation(userId1: string, userId2: string): Promise<string> {
    // Check for existing conversation
    const conversationsQuery = query(
      collection(db, COLLECTIONS.CHATS),
      where('participantIds', 'array-contains', userId1)
    );
    const conversationsDocs = await getDocs(conversationsQuery);

    for (const doc of conversationsDocs.docs) {
      const conv = doc.data() as Conversation;
      if (conv.participantIds.includes(userId2)) {
        return doc.id;
      }
    }

    // Create new conversation
    const conversationId = doc(collection(db, COLLECTIONS.CHATS)).id;
    const conversation: Conversation = {
      id: conversationId,
      participantIds: [userId1, userId2],
      unreadCount: { [userId1]: 0, [userId2]: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, COLLECTIONS.CHATS, conversationId), {
      ...conversation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return conversationId;
  }
}

export default FriendsAPI;
