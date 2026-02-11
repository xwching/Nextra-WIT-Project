import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EventCard } from '@/components/ui/event-card';
import { EventsAPI } from '@/services/api/events.api';
import { auth } from '@/services/firebase/config';
import { Event as FirebaseEvent, EventStatus } from '@/types/event.types';
import { Event as MockEvent } from '@/constants/mockData';
import { AppColors } from '@/constants/colors';

const EVENT_TYPE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  creative: 'palette',
  tech: 'code-tags',
  games: 'gamepad-variant',
  social: 'message-text',
  learning: 'book-open-page-variant',
  activity: 'run',
  community: 'heart',
};

// Helper to convert Firestore Timestamp or Date to JS Date
function toJSDate(val: any): Date {
  if (val instanceof Date) return val;
  if (val && typeof val.toDate === 'function') return val.toDate(); // Firestore Timestamp
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

export default function EventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'happening' | 'upcoming' | 'past' | 'mine'>('upcoming');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const fetched = await EventsAPI.getEvents({});
      setEvents(fetched);
    } catch (err: any) {
      console.error('Fetch events error:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Re-fetch when screen comes into focus (e.g. after creating an event)
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const now = new Date();
  const userId = auth.currentUser?.uid;

  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.type === filterType);

  const upcomingEvents = filteredEvents.filter(e => {
    const start = toJSDate(e.startTime);
    return !e.isLive && start > now && e.status === EventStatus.UPCOMING;
  });

  const happeningNow = filteredEvents.filter(e => e.isLive);

  const pastEvents = filteredEvents.filter(e => {
    const end = toJSDate(e.endTime);
    return end < now || e.status === EventStatus.ENDED;
  });

  const myEvents = filteredEvents.filter(e => e.creatorId === userId);

  const renderEmptyState = (message: string, subtitle?: string) => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="calendar-blank" size={48} color="#9CA3AF" />
      <Text style={styles.emptyText}>{message}</Text>
      {subtitle && <Text style={styles.emptySubtext}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[AppColors.primary.main, AppColors.primary.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>Events</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => router.push('/create-event')}>
            <MaterialCommunityIcons name="plus" size={20} color={AppColors.primary.main} />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Toggle */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons name="filter-variant" size={16} color="white" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          {filterType !== 'all' && (
            <View style={styles.activeFilterBadge}>
              <TouchableOpacity onPress={() => setFilterType('all')}>
                <Text style={styles.activeFilterText}>{filterType} ✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Event Type</Text>
          <View style={styles.filterTypes}>
            {Object.entries(EVENT_TYPE_ICONS).map(([type, iconName]) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterTypeButton,
                  filterType === type && styles.filterTypeButtonActive,
                ]}
                onPress={() => setFilterType(type)}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={14}
                  color={filterType === type ? 'white' : '#374151'}
                />
                <Text
                  style={[
                    styles.filterTypeText,
                    filterType === type && styles.filterTypeTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'happening', label: 'Now' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
          { key: 'mine', label: 'Mine' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary.main} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === 'happening' && (
              <>
                {happeningNow.length === 0
                  ? renderEmptyState('No events happening right now', 'Check back soon!')
                  : happeningNow.map(event => (
                      <EventCard
                        key={event.id}
                        event={toCardEvent(event)}
                        onPress={() => router.push(`/event/${event.id}` as any)}
                      />
                    ))}
              </>
            )}

            {activeTab === 'upcoming' && (
              <>
                {upcomingEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="calendar-blank" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No upcoming events yet</Text>
                    <Text style={styles.emptySubtext}>Create one to get started!</Text>
                    <TouchableOpacity
                      style={styles.createEventButton}
                      onPress={() => router.push('/create-event')}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color="white" />
                      <Text style={styles.createEventButtonText}>Create Event</Text>
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
              </>
            )}

            {activeTab === 'past' && (
              <>
                {pastEvents.length === 0
                  ? renderEmptyState('No past events yet')
                  : pastEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={toCardEvent(event)}
                        onPress={() => router.push(`/event/${event.id}` as any)}
                      />
                    ))}
              </>
            )}

            {activeTab === 'mine' && (
              <>
                {myEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="calendar-blank" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>Events you're hosting will appear here</Text>
                    <TouchableOpacity
                      style={styles.createEventButton}
                      onPress={() => router.push('/create-event')}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color="white" />
                      <Text style={styles.createEventButtonText}>Create Your First Event</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={toCardEvent(event)}
                      onPress={() => router.push(`/event/${event.id}` as any)}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  createButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createButtonText: {
    color: AppColors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonText: {
    fontSize: 14,
    color: 'white',
  },
  activeFilterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeFilterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  filterTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  filterTypeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTypeText: {
    fontSize: 13,
    color: '#374151',
    textTransform: 'capitalize',
  },
  filterTypeTextActive: {
    color: 'white',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: AppColors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  createEventButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
