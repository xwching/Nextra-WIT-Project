import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EventCard } from '@/components/ui/event-card';
import { CustomBadge } from '@/components/ui/custom-badge';
import { currentUser, mockEvents, mockUsers } from '@/constants/mockData';
import { AppColors } from '@/constants/colors';

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

  // Get upcoming events (next 3)
  const upcomingEvents = mockEvents.filter(e => !e.isLive).slice(0, 3);
  const liveEvents = mockEvents.filter(e => e.isLive);

  // Friend activity data
  const friendActivity = [
    { user: mockUsers[0], action: 'joined Book Club', time: '2 hours ago' },
    { user: mockUsers[1], action: 'earned "Conversation Catalyst" badge', time: '3 hours ago' },
    { user: mockUsers[2], action: 'is hosting Drawing Challenge tomorrow', time: '5 hours ago' },
  ];

  // Question of the day
  const qotd = {
    question: "What's your favorite way to unwind after a busy day?",
    answers: [
      { user: mockUsers[0], answer: "Coffee and a good book!", likes: 12 },
      { user: mockUsers[2], answer: "Drawing or any creative activity", likes: 8 },
    ],
  };

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
            <Text style={styles.userName}>{currentUser.name}! 👋</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Energy & Mood */}
        <View style={styles.statusBar}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>● Online</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{currentUser.mood} Feeling great</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>⚡ {currentUser.energyLevel} energy</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats with Animated Gradients */}
      <View style={styles.quickStats}>
        <AnimatedStatCard
          icon="fire"
          iconColor="#F59E0B"
          value="7"
          label="Day Streak"
          colors={['#FEF3C7', '#FDE68A']}
        />
        <AnimatedStatCard
          icon="calendar-check"
          iconColor="#2563EB"
          value="5"
          label="This Week"
          colors={['#DBEAFE', '#BFDBFE']}
        />
        <AnimatedStatCard
          icon="account-group"
          iconColor="#8B5CF6"
          value="47"
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
            event={liveEvents[0]}
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
        {upcomingEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => router.push(`/event/${event.id}` as any)}
          />
        ))}
      </View>

      {/* Question of the Day */}
      <View style={styles.qotdCard}>
        <View style={styles.qotdHeader}>
          <MaterialCommunityIcons name="comment-question" size={20} color="#2563EB" />
          <Text style={styles.qotdTitle}>Question of the Day</Text>
        </View>
        <Text style={styles.qotdQuestion}>{qotd.question}</Text>

        <View style={styles.qotdAnswers}>
          {qotd.answers.map((answer, i) => (
            <View key={i} style={styles.qotdAnswer}>
              <View style={styles.qotdAnswerHeader}>
                <Text style={styles.qotdAvatar}>{answer.user.avatar}</Text>
                <Text style={styles.qotdUserName}>{answer.user.name}</Text>
              </View>
              <Text style={styles.qotdAnswerText}>{answer.answer}</Text>
              <View style={styles.qotdLikes}>
                <MaterialCommunityIcons name="heart" size={14} color="#EF4444" />
                <Text style={styles.qotdLikesText}>{answer.likes}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.qotdInputContainer}>
          <TextInput
            style={styles.qotdInput}
            placeholder="Share your answer..."
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.qotdSubmitButton}>
            <MaterialCommunityIcons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Friend Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friend Activity</Text>
        </View>
        <View style={styles.activityCard}>
          {friendActivity.map((activity, i) => (
            <View
              key={i}
              style={[
                styles.activityItem,
                i < friendActivity.length - 1 && styles.activityItemBorder,
              ]}
            >
              <Text style={styles.activityAvatar}>{activity.user.avatar}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUserName}>{activity.user.name}</Text>
                  {' '}
                  {activity.action}
                </Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

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
  qotdCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  qotdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  qotdTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  qotdQuestion: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 22,
  },
  qotdAnswers: {
    gap: 12,
    marginBottom: 16,
  },
  qotdAnswer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  qotdAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  qotdAvatar: {
    fontSize: 16,
  },
  qotdUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  qotdAnswerText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  qotdLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qotdLikesText: {
    fontSize: 12,
    color: '#6B7280',
  },
  qotdInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  qotdInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    fontSize: 14,
    color: '#111827',
  },
  qotdSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
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
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  activityUserName: {
    fontWeight: '600',
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 24,
  },
});
