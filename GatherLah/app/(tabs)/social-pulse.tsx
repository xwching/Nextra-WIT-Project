import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/colors';
import { AINudge, LonelinessScore, NudgeCategory } from '@/types/agent.types';
import {
  runSocialMomentumAgent,
  getUserNudges,
  markNudgeRead,
  dismissNudge,
  getAgentSummary,
} from '@/services/agent/social-agent';

// ── Category config ────────────────────────────────────────
const CATEGORY_META: Record<NudgeCategory, { icon: string; color: string; label: string }> = {
  event_suggestion: { icon: 'calendar-star', color: '#3B82F6', label: 'Event' },
  friend_reconnect: { icon: 'account-heart', color: '#EC4899', label: 'Friend' },
  streak_encouragement: { icon: 'fire', color: '#F59E0B', label: 'Streak' },
  general_tip: { icon: 'lightbulb-on', color: '#10B981', label: 'Tip' },
  comeback_welcome: { icon: 'hand-wave', color: '#8B5CF6', label: 'Welcome' },
  milestone_celebration: { icon: 'trophy', color: '#EF4444', label: 'Milestone' },
};

// ── Wellness Ring SVG-free ──────────────────────────────────
function WellnessRing({ score, trend }: { score: number; trend: string }) {
  const wellness = 100 - score; // invert: higher = better
  const ringColor =
    wellness >= 70 ? '#10B981' : wellness >= 40 ? '#F59E0B' : '#EF4444';
  const trendIcon =
    trend === 'improving' ? 'trending-up' : trend === 'worsening' ? 'trending-down' : 'minus';
  const trendColor =
    trend === 'improving' ? '#10B981' : trend === 'worsening' ? '#EF4444' : '#6B7280';
  const label =
    wellness >= 70 ? 'Great' : wellness >= 40 ? 'Okay' : 'Needs Love';

  return (
    <View style={styles.ringContainer}>
      <View style={[styles.ringOuter, { borderColor: ringColor }]}>
        <View style={styles.ringInner}>
          <Text style={[styles.ringScore, { color: ringColor }]}>{wellness}</Text>
          <Text style={styles.ringLabel}>{label}</Text>
        </View>
      </View>
      <View style={styles.trendRow}>
        <MaterialCommunityIcons name={trendIcon as any} size={16} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {trend === 'improving' ? 'Improving' : trend === 'worsening' ? 'Declining' : 'Stable'}
        </Text>
      </View>
    </View>
  );
}

// ── Nudge Card ──────────────────────────────────────────────
function NudgeCard({
  nudge,
  onRead,
  onDismiss,
  onEventPress,
}: {
  nudge: AINudge;
  onRead: () => void;
  onDismiss: () => void;
  onEventPress: () => void;
}) {
  const meta = CATEGORY_META[nudge.category] || CATEGORY_META.general_tip;
  const isUnread = !nudge.isRead;

  return (
    <TouchableOpacity
      style={[styles.nudgeCard, isUnread && styles.nudgeCardUnread]}
      onPress={onRead}
      activeOpacity={0.7}
    >
      <View style={styles.nudgeHeader}>
        <View style={[styles.nudgeIconBg, { backgroundColor: meta.color + '20' }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
        </View>
        <View style={styles.nudgeHeaderText}>
          <Text style={styles.nudgeCategoryLabel}>{meta.label}</Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.nudgeMessage}>{nudge.message}</Text>

      {/* Action buttons */}
      <View style={styles.nudgeActions}>
        {nudge.suggestedEventTitle && (
          <TouchableOpacity style={styles.nudgeActionBtn} onPress={onEventPress}>
            <MaterialCommunityIcons name="calendar-arrow-right" size={16} color="#3B82F6" />
            <Text style={styles.nudgeActionText}>{nudge.suggestedEventTitle}</Text>
          </TouchableOpacity>
        )}
        {nudge.suggestedFriendName && (
          <View style={styles.nudgeActionBtn}>
            <MaterialCommunityIcons name="account-arrow-right" size={16} color="#EC4899" />
            <Text style={styles.nudgeActionText}>Say hi to {nudge.suggestedFriendName}</Text>
          </View>
        )}
      </View>

      {/* Priority indicator */}
      {nudge.priority === 'high' && (
        <View style={styles.priorityBadge}>
          <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
          <Text style={styles.priorityText}>Priority</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function SocialPulseScreen() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [nudges, setNudges] = useState<AINudge[]>([]);
  const [score, setScore] = useState<LonelinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const agentRunningRef = useRef(false);

  const userId = firebaseUser?.uid;

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [fetchedNudges, summary] = await Promise.all([
        getUserNudges(userId),
        getAgentSummary(userId),
      ]);
      setNudges(fetchedNudges.filter(n => !n.isDismissed));
      if (summary.lonelinessScore) setScore(summary.lonelinessScore);
    } catch (err) {
      console.warn('Social Pulse load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const runAgent = useCallback(async () => {
    if (!userId || agentRunningRef.current) return;
    agentRunningRef.current = true;
    setAgentRunning(true);
    try {
      await runSocialMomentumAgent(userId);
      await loadData();
    } catch (err) {
      console.warn('Agent run error:', err);
    } finally {
      agentRunningRef.current = false;
      setAgentRunning(false);
    }
  }, [userId, loadData]);

  // Load data + run agent once on focus (stable deps)
  useFocusEffect(
    useCallback(() => {
      loadData();
      runAgent();
    }, [loadData, runAgent])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await runAgent();
    setRefreshing(false);
  }, [runAgent]);

  const handleRead = async (nudgeId: string) => {
    await markNudgeRead(nudgeId);
    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, isRead: true } : n));
  };

  const handleDismiss = async (nudgeId: string) => {
    await dismissNudge(nudgeId);
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  };

  const unreadCount = nudges.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary.main} />
        <Text style={styles.loadingText}>Checking your social pulse...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary.main} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={AppColors.gradients.ocean}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Social Pulse</Text>
            <Text style={styles.subtitle}>Your social wellness companion</Text>
          </View>
          {agentRunning && (
            <ActivityIndicator size="small" color="white" />
          )}
        </View>

        {/* Wellness Ring */}
        {score && (
          <View style={styles.wellnessCard}>
            <WellnessRing score={score.score} trend={score.trend} />
            <View style={styles.wellnessDetails}>
              <Text style={styles.wellnessTitle}>Social Wellness</Text>
              <View style={styles.componentRow}>
                <Text style={styles.componentLabel}>Activity</Text>
                <View style={styles.componentBar}>
                  <View style={[styles.componentFill, { width: `${100 - (score.components.inactivityDays / 30) * 100}%`, backgroundColor: '#10B981' }]} />
                </View>
              </View>
              <View style={styles.componentRow}>
                <Text style={styles.componentLabel}>Events</Text>
                <View style={styles.componentBar}>
                  <View style={[styles.componentFill, { width: `${100 - (score.components.missedEvents / 15) * 100}%`, backgroundColor: '#3B82F6' }]} />
                </View>
              </View>
              <View style={styles.componentRow}>
                <Text style={styles.componentLabel}>Streak</Text>
                <View style={styles.componentBar}>
                  <View style={[styles.componentFill, { width: `${100 - (score.components.streakDecay / 20) * 100}%`, backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
              <View style={styles.componentRow}>
                <Text style={styles.componentLabel}>Chat</Text>
                <View style={styles.componentBar}>
                  <View style={[styles.componentFill, { width: `${100 - (score.components.chatInactivity / 20) * 100}%`, backgroundColor: '#EC4899' }]} />
                </View>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/(tabs)/events' as any)}
        >
          <MaterialCommunityIcons name="calendar-search" size={22} color="#3B82F6" />
          <Text style={styles.quickActionLabel}>Find Events</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/(tabs)/friends' as any)}
        >
          <MaterialCommunityIcons name="account-search" size={22} color="#EC4899" />
          <Text style={styles.quickActionLabel}>Find Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/(tabs)/explore' as any)}
        >
          <MaterialCommunityIcons name="compass" size={22} color="#10B981" />
          <Text style={styles.quickActionLabel}>Explore</Text>
        </TouchableOpacity>
      </View>

      {/* Nudges Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="bell-ring" size={20} color={AppColors.primary.main} />
            <Text style={styles.sectionTitle}>Nudges</Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {nudges.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptySubtext}>
              Keep being social — new nudges will appear when the agent has suggestions for you.
            </Text>
          </View>
        ) : (
          nudges.map(nudge => (
            <NudgeCard
              key={nudge.id}
              nudge={nudge}
              onRead={() => handleRead(nudge.id)}
              onDismiss={() => handleDismiss(nudge.id)}
              onEventPress={() => {
                if (nudge.suggestedEventId) {
                  router.push(`/event/${nudge.suggestedEventId}` as any);
                }
              }}
            />
          ))
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Wellness Ring
  ringContainer: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    alignItems: 'center',
  },
  ringScore: {
    fontSize: 24,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Wellness Card
  wellnessCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wellnessDetails: {
    flex: 1,
  },
  wellnessTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  componentLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 55,
  },
  componentBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  componentFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  // Sections
  section: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 4,
  },
  countBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  // Nudge Card
  nudgeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  nudgeCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary.main,
  },
  nudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nudgeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgeHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  nudgeCategoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  nudgeMessage: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 10,
  },
  nudgeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nudgeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nudgeActionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 12,
    right: 36,
  },
  priorityText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  bottomSpacing: {
    height: 24,
  },
});
