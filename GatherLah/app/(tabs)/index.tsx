import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, getDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { EventCard } from '@/components/ui/event-card';
import { useAuth } from '@/contexts/AuthContext';
import { EventsAPI } from '@/services/api/events.api';
import { db, COLLECTIONS } from '@/services/firebase/config';
import { Event as FirebaseEvent, EventStatus } from '@/types/event.types';
import { Event as MockEvent } from '@/constants/mockData';
import { User } from '@/types/user.types';
import { Friendship } from '@/types/social.types';
import { AppColors } from '@/constants/colors';

// Helper to convert Firestore Timestamp or Date to JS Date
function toJSDate(val: any): Date {
  if (val instanceof Date) return val;
  if (val && typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
}

// Convert Firebase event to the mock Event shape that EventCard expects
function toCardEvent(e: FirebaseEvent): MockEvent {
  const startTime = toJSDate(e.startTime);
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type as MockEvent['type'],
    intensity: 'medium',
    duration: 'medium',
    host: {
      id: e.creatorId,
      username: 'host',
      name: 'Event Host',
      avatar: '🎉',
      bio: '',
      isOnline: true,
      energyLevel: 'high',
      interests: [],
      joinedDate: '',
    },
    startTime: startTime.toISOString(),
    participants: e.currentParticipants,
    maxParticipants: e.maxParticipants ?? 999,
    friendsAttending: [],
    tags: e.tags || [],
    isLive: e.isLive,
    location: e.location === 'online' ? 'virtual' : e.location === 'in-person' ? 'nearby' : 'anywhere',
  };
}

// Animated Stat Card Component
function AnimatedStatCard({ icon, iconColor, value, label, colors }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
          <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [eventsThisWeek, setEventsThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const fetchHomeData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch events
      const fetchedEvents = await EventsAPI.getEvents({});
      setEvents(fetchedEvents);

      // Count events this week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekEvents = fetchedEvents.filter(e => {
        const start = toJSDate(e.startTime);
        return start >= startOfWeek && start <= now;
      });
      setEventsThisWeek(weekEvents.length);

      // Fetch friends from subcollection
      try {
        const friendsSnap = await getDocs(collection(db, `${COLLECTIONS.USERS}/${user.id}/friends`));
        const friendships = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
        setFriendsCount(friendships.length);

        // Get first 5 friend profiles for the activity section
        const friendProfiles: User[] = [];
        for (const f of friendships.slice(0, 5)) {
          const friendId = f.userId1 === user.id ? f.userId2 : f.userId1;
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, friendId));
          if (userDoc.exists()) {
            friendProfiles.push({ id: userDoc.id, ...userDoc.data() } as User);
          }
        }
        setFriends(friendProfiles);
      } catch (err) {
        console.error('Fetch friends error:', err);
        setFriendsCount(user.friendsCount || 0);
      }

      // Fetch pending friend request count
      try {
        const requestsQuery = query(
          collection(db, COLLECTIONS.FRIEND_REQUESTS),
          where('receiverId', '==', user.id),
          where('status', '==', 'pending')
        );
        const requestsSnap = await getDocs(requestsQuery);
        setPendingRequestCount(requestsSnap.size);
      } catch (err) {
        console.error('Fetch requests error:', err);
      }
    } catch (err) {
      console.error('Home data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [user?.id])
  );

  const now = new Date();
  const liveEvents = events.filter(e => e.isLive);
  const upcomingEvents = events
    .filter(e => {
      const start = toJSDate(e.startTime);
      return !e.isLive && start > now && e.status === EventStatus.UPCOMING;
    })
    .slice(0, 3);

  const displayName = user?.displayName || user?.username || 'there';
  const streak = user?.currentStreak || 0;

  if (loading && !events.length) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AppColors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={AppColors.primary.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{displayName}!</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/friends' as any)}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
            {pendingRequestCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{pendingRequestCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* User Level & XP */}
        <View style={styles.statusBar}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Level {user?.level || 1}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{user?.experiencePoints || 0} XP</Text>
          </View>
          {streak > 0 && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>🔥 {streak} day streak</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Quick Stats with Animated Gradients */}
      <View style={styles.quickStats}>
        <AnimatedStatCard
          icon="fire"
          iconColor="#F59E0B"
          value={streak}
          label="Day Streak"
          colors={['#FEF3C7', '#FDE68A']}
        />
        <AnimatedStatCard
          icon="calendar-check"
          iconColor="#2563EB"
          value={eventsThisWeek}
          label="This Week"
          colors={['#DBEAFE', '#BFDBFE']}
        />
        <AnimatedStatCard
          icon="account-group"
          iconColor="#8B5CF6"
          value={friendsCount}
          label="Friends"
          colors={['#F3E8FF', '#E9D5FF']}
        />
      </View>

      {/* Live Events Alert */}
      {liveEvents.length > 0 && (
        <View style={styles.liveAlert}>
          <View style={styles.liveAlertHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
            <Text style={styles.liveCount}>{liveEvents.length} event{liveEvents.length > 1 ? 's' : ''}</Text>
          </View>
          <EventCard
            event={toCardEvent(liveEvents[0])}
            onPress={() => router.push(`/event/${liveEvents[0].id}` as any)}
          />
        </View>
      )}

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => router.push('/events' as any)}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank" size={36} color="#9CA3AF" />
            <Text style={styles.emptyText}>No upcoming events</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-event')}
            >
              <MaterialCommunityIcons name="plus" size={16} color="white" />
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingEvents.map(event => (
            <EventCard
              key={event.id}
              event={toCardEvent(event)}
              onPress={() => router.push(`/event/${event.id}` as any)}
            />
          ))
        )}
      </View>

      {/* Friends Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Friends</Text>
          <TouchableOpacity onPress={() => router.push('/friends' as any)}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        {friends.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-group" size={36} color="#9CA3AF" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>
              Search for users in the Friends tab to connect!
            </Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {friends.map((friend, i) => (
              <View
                key={friend.id}
                style={[
                  styles.activityItem,
                  i < friends.length - 1 && styles.activityItemBorder,
                ]}
              >
                <Text style={styles.activityAvatar}>{friend.avatar || '👤'}</Text>
                <View style={styles.activityContent}>
                  <Text style={styles.activityUserName}>
                    {friend.displayName || friend.username}
                  </Text>
                  <Text style={styles.activityTime}>
                    @{friend.username}{friend.isOnline ? '  ● Online' : ''}
                  </Text>
                </View>
                {friend.isOnline && (
                  <View style={styles.onlineDot} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Events Created by You */}
      {events.filter(e => e.creatorId === user?.id).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Events</Text>
          </View>
          {events
            .filter(e => e.creatorId === user?.id)
            .slice(0, 2)
            .map(event => (
              <EventCard
                key={event.id}
                event={toCardEvent(event)}
                onPress={() => router.push(`/event/${event.id}` as any)}
              />
            ))}
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  liveAlert: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    marginBottom: 12,
  },
  liveAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  liveCount: {
    fontSize: 12,
    color: '#991B1B',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityAvatar: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityUserName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 14,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  bottomSpacing: {
    height: 24,
  },
});
