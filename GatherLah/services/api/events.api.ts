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
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase/config';
import {
  Event,
  EventType,
  EventStatus,
  EventParticipant,
  EventChat,
  EventPost,
  EventEntry,
  EventFilter,
} from '@/types/event.types';

export class EventsAPI {
  /**
   * Create a new event
   */
  static async createEvent(
    userId: string,
    eventData: Omit<Event, 'id' | 'creatorId' | 'currentParticipants' | 'participantIds' | 'moderatorIds' | 'status' | 'isLive' | 'viewCount' | 'interestCount' | 'createdAt' | 'updatedAt'>
  ): Promise<Event> {
    try {
      const eventId = doc(collection(db, COLLECTIONS.EVENTS)).id;

      const newEvent: Event = {
        ...eventData,
        id: eventId,
        creatorId: userId,
        moderatorIds: [],
        currentParticipants: 1,
        participantIds: [userId],
        waitlistIds: [],
        status: EventStatus.UPCOMING,
        isLive: false,
        viewCount: 0,
        interestCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
        ...newEvent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create default main chat
      await this.createEventChat(eventId, userId, 'Main Discussion', true);

      // Add creator as participant
      await this.addParticipant(eventId, userId, 'creator');

      // Update user stats
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        totalEventsCreated: increment(1),
        experiencePoints: increment(50), // XP for creating event
      });

      return newEvent;
    } catch (error: any) {
      console.error('Create event error:', error);
      throw new Error(error.message || 'Failed to create event');
    }
  }

  /**
   * Join an event
   */
  static async joinEvent(eventId: string, userId: string): Promise<void> {
    try {
      const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const event = eventDoc.data() as Event;

      // Check if event is kid-friendly for child accounts
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      const userData = userDoc.data();
      if (userData?.isKidFriendlyOnly && !event.isKidFriendly) {
        throw new Error('This event is not available for child accounts');
      }

      // Check if already joined
      if (event.participantIds.includes(userId)) {
        throw new Error('Already joined this event');
      }

      // Check max participants
      if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
        if (event.requiresApproval) {
          // Add to waitlist
          await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
            waitlistIds: arrayUnion(userId),
            updatedAt: serverTimestamp(),
          });
          return;
        }
        throw new Error('Event is full');
      }

      // Add participant
      await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
        participantIds: arrayUnion(userId),
        currentParticipants: increment(1),
        updatedAt: serverTimestamp(),
      });

      await this.addParticipant(eventId, userId, 'participant');

      // Update user stats
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        totalEventsJoined: increment(1),
        experiencePoints: increment(10), // XP for joining event
      });
    } catch (error: any) {
      console.error('Join event error:', error);
      throw new Error(error.message || 'Failed to join event');
    }
  }

  /**
   * Leave an event
   */
  static async leaveEvent(eventId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
        participantIds: arrayRemove(userId),
        currentParticipants: increment(-1),
        updatedAt: serverTimestamp(),
      });

      // Remove participant record
      const participantsQuery = query(
        collection(db, COLLECTIONS.EVENT_PARTICIPANTS),
        where('eventId', '==', eventId),
        where('userId', '==', userId)
      );
      const participantDocs = await getDocs(participantsQuery);
      participantDocs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    } catch (error: any) {
      console.error('Leave event error:', error);
      throw new Error(error.message || 'Failed to leave event');
    }
  }

  /**
   * Add moderator to event
   */
  static async addModerator(eventId: string, userId: string, moderatorId: string): Promise<void> {
    try {
      const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const event = eventDoc.data() as Event;
      if (event.creatorId !== userId) {
        throw new Error('Only event creator can add moderators');
      }

      await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
        moderatorIds: arrayUnion(moderatorId),
        updatedAt: serverTimestamp(),
      });

      // Update participant role
      const participantQuery = query(
        collection(db, COLLECTIONS.EVENT_PARTICIPANTS),
        where('eventId', '==', eventId),
        where('userId', '==', moderatorId)
      );
      const participantDocs = await getDocs(participantQuery);
      if (!participantDocs.empty) {
        await updateDoc(participantDocs.docs[0].ref, {
          role: 'moderator',
        });
      }
    } catch (error: any) {
      console.error('Add moderator error:', error);
      throw new Error(error.message || 'Failed to add moderator');
    }
  }

  /**
   * Create event chat
   */
  static async createEventChat(
    eventId: string,
    creatorId: string,
    name: string,
    isMainChat: boolean = false,
    isPublic: boolean = true
  ): Promise<EventChat> {
    try {
      const chatId = doc(collection(db, COLLECTIONS.EVENT_CHATS)).id;

      const chat: EventChat = {
        id: chatId,
        eventId: eventId,
        name: name,
        isMainChat: isMainChat,
        isPublic: isPublic,
        requiresApproval: !isPublic,
        creatorId: creatorId,
        moderatorIds: [],
        memberIds: isMainChat ? [] : [creatorId], // Main chat includes all event members
        maxMembers: isMainChat ? undefined : 5,
        isMuted: false,
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.EVENT_CHATS, chatId), {
        ...chat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return chat;
    } catch (error: any) {
      console.error('Create event chat error:', error);
      throw new Error(error.message || 'Failed to create event chat');
    }
  }

  /**
   * Create event post
   */
  static async createPost(
    eventId: string,
    authorId: string,
    content: string,
    images?: string[]
  ): Promise<EventPost> {
    try {
      const postId = doc(collection(db, COLLECTIONS.POSTS)).id;

      const post: EventPost = {
        id: postId,
        eventId: eventId,
        authorId: authorId,
        content: content,
        images: images,
        isPinned: false,
        likes: [],
        likeCount: 0,
        replyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.POSTS, postId), {
        ...post,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return post;
    } catch (error: any) {
      console.error('Create post error:', error);
      throw new Error(error.message || 'Failed to create post');
    }
  }

  /**
   * Submit competition entry
   */
  static async submitEntry(
    eventId: string,
    participantId: string,
    title: string,
    description: string,
    submissionUrl?: string,
    images?: string[]
  ): Promise<EventEntry> {
    try {
      const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const event = eventDoc.data() as Event;
      if (!event.isCompetition) {
        throw new Error('This event is not a competition');
      }

      const entryId = doc(collection(db, COLLECTIONS.EVENT_ENTRIES)).id;

      const entry: EventEntry = {
        id: entryId,
        eventId: eventId,
        participantId: participantId,
        title: title,
        description: description,
        submissionUrl: submissionUrl,
        images: images,
        votes: [],
        voteCount: 0,
        isApproved: !event.requiresApproval,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.EVENT_ENTRIES, entryId), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Mark participant as having submitted entry
      const participantQuery = query(
        collection(db, COLLECTIONS.EVENT_PARTICIPANTS),
        where('eventId', '==', eventId),
        where('userId', '==', participantId)
      );
      const participantDocs = await getDocs(participantQuery);
      if (!participantDocs.empty) {
        await updateDoc(participantDocs.docs[0].ref, {
          hasSubmittedEntry: true,
          entryId: entryId,
        });
      }

      return entry;
    } catch (error: any) {
      console.error('Submit entry error:', error);
      throw new Error(error.message || 'Failed to submit entry');
    }
  }

  /**
   * Vote on competition entry
   */
  static async voteEntry(entryId: string, userId: string): Promise<void> {
    try {
      const entryDoc = await getDoc(doc(db, COLLECTIONS.EVENT_ENTRIES, entryId));
      if (!entryDoc.exists()) {
        throw new Error('Entry not found');
      }

      const entry = entryDoc.data() as EventEntry;
      if (entry.votes.includes(userId)) {
        throw new Error('Already voted for this entry');
      }

      // Check if voting is enabled
      const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, entry.eventId));
      const event = eventDoc.data() as Event;
      if (!event.votingEnabled) {
        throw new Error('Voting is not enabled for this event');
      }

      await updateDoc(doc(db, COLLECTIONS.EVENT_ENTRIES, entryId), {
        votes: arrayUnion(userId),
        voteCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Vote entry error:', error);
      throw new Error(error.message || 'Failed to vote');
    }
  }

  /**
   * Get events with filters
   */
  static async getEvents(filters: EventFilter): Promise<Event[]> {
    try {
      let q = query(collection(db, COLLECTIONS.EVENTS));

      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.isKidFriendly !== undefined) {
        q = query(q, where('isKidFriendly', '==', filters.isKidFriendly));
      }

      q = query(q, orderBy('startTime', 'desc'), limit(50));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error: any) {
      console.error('Get events error:', error);
      throw new Error(error.message || 'Failed to get events');
    }
  }

  // Helper methods
  private static async addParticipant(
    eventId: string,
    userId: string,
    role: 'creator' | 'moderator' | 'participant'
  ): Promise<void> {
    const participantId = doc(collection(db, COLLECTIONS.EVENT_PARTICIPANTS)).id;

    const participant: EventParticipant = {
      id: participantId,
      eventId: eventId,
      userId: userId,
      role: role,
      joinedAt: new Date(),
    };

    await setDoc(doc(db, COLLECTIONS.EVENT_PARTICIPANTS, participantId), {
      ...participant,
      joinedAt: serverTimestamp(),
    });
  }
}

export default EventsAPI;
