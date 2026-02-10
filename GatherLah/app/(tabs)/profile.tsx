import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomBadge } from '@/components/ui/custom-badge';
import { StatCard } from '@/components/ui/stat-card';
import { currentUser, badges, profileStats } from '@/constants/mockData';
import { AppColors } from '@/constants/colors';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'stats' | 'settings'>('overview');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [friendActivity, setFriendActivity] = useState(true);
  const [badgesNotif, setBadgesNotif] = useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header with Gradient */}
      <LinearGradient
        colors={AppColors.gradients.ocean}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <View style={styles.profileTop}>
          {/* Avatar with Glow */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{currentUser.avatar}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialCommunityIcons name="pencil" size={12} color="white" />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{currentUser.name}</Text>
                <Text style={styles.username}>@{currentUser.username}</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <MaterialCommunityIcons name="pencil" size={12} color="white" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bio}>{currentUser.bio}</Text>

            {/* Status Indicators */}
            <View style={styles.statusIndicators}>
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

            {/* Social Stats */}
            <View style={styles.socialStats}>
              <TouchableOpacity>
                <Text style={styles.statValue}>{profileStats.friends}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.statValue}>{profileStats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.statValue}>{profileStats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="share-variant" size={16} color="#374151" />
            <Text style={styles.actionButtonText}>Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="qrcode" size={16} color="#374151" />
            <Text style={styles.actionButtonText}>QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="cog" size={16} color="white" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Streak & Impact */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.streakCard]}>
          <View style={styles.statCardContent}>
            <Text style={styles.statEmoji}>🔥</Text>
            <View>
              <Text style={styles.statCardLabel}>Streak</Text>
              <Text style={styles.statCardValue}>{profileStats.streak} days</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statCard, styles.impactCard]}>
          <View style={styles.statCardContent}>
            <Text style={styles.statEmoji}>⭐</Text>
            <View>
              <Text style={styles.statCardLabel}>Impact Points</Text>
              <Text style={styles.statCardValue}>{profileStats.impactPoints}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['overview', 'badges', 'stats', 'settings'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'overview' && (
          <View style={styles.overviewContent}>
            {/* Activity Stats */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>This Month</Text>
              <View style={styles.activityGrid}>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#2563EB" />
                  <View>
                    <Text style={styles.activityValue}>{profileStats.eventsJoined}</Text>
                    <Text style={styles.activityLabel}>Events Joined</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
                  <View>
                    <Text style={styles.activityValue}>{profileStats.eventsHosted}</Text>
                    <Text style={styles.activityLabel}>Events Hosted</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#8B5CF6" />
                  <View>
                    <Text style={styles.activityValue}>{profileStats.connectionsMade}</Text>
                    <Text style={styles.activityLabel}>Connections Made</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="trending-up" size={20} color="#10B981" />
                  <View>
                    <Text style={styles.activityValue}>+12%</Text>
                    <Text style={styles.activityLabel}>Growth</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Recent Badges */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Achievements</Text>
              <View style={styles.badgesList}>
                {badges.slice(0, 3).map(badge => (
                  <View key={badge.name} style={styles.badgeItem}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <View style={styles.badgeInfo}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeDescription}>{badge.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllButtonText}>View All Badges</Text>
              </TouchableOpacity>
            </View>

            {/* Your Impact */}
            <View style={[styles.card, styles.impactSummary]}>
              <Text style={styles.cardTitle}>Your Impact</Text>
              <View style={styles.impactItems}>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>People you've helped</Text>
                  <Text style={styles.impactValue}>24</Text>
                </View>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Made their day</Text>
                  <Text style={styles.impactValue}>3 times 💚</Text>
                </View>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Events created</Text>
                  <Text style={styles.impactValue}>5</Text>
                </View>
              </View>
            </View>

            {/* Member Since */}
            <View style={styles.card}>
              <Text style={styles.memberSince}>
                Member since {new Date(currentUser.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'badges' && (
          <View style={styles.badgesGrid}>
            {badges.map(badge => (
              <View key={badge.name} style={styles.badgeCard}>
                <Text style={styles.badgeCardIcon}>{badge.icon}</Text>
                <Text style={styles.badgeCardName}>{badge.name}</Text>
                <Text style={styles.badgeCardDescription}>{badge.description}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>All Time Stats</Text>
            <View style={styles.statsTable}>
              {[
                { label: 'Total Events', value: '29' },
                { label: 'Events Hosted', value: '5' },
                { label: 'Connections Made', value: '47' },
                { label: 'Total Impact Points', value: '856' },
                { label: 'Longest Streak', value: '12 days 🔥' },
                { label: 'Badges Earned', value: badges.length.toString() },
              ].map((stat, i) => (
                <View key={i} style={styles.statsTableRow}>
                  <Text style={styles.statsLabel}>{stat.label}</Text>
                  <Text style={styles.statsValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'settings' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Privacy Settings</Text>
              <View style={styles.settingsGroup}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Profile Visibility</Text>
                  <View style={styles.picker}>
                    <Text style={styles.pickerText}>Public</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
                  </View>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Who can send friend requests</Text>
                  <View style={styles.picker}>
                    <Text style={styles.pickerText}>Everyone</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
                  </View>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show online status</Text>
                  <Switch
                    value={showOnlineStatus}
                    onValueChange={setShowOnlineStatus}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={showOnlineStatus ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show activity</Text>
                  <Switch
                    value={showActivity}
                    onValueChange={setShowActivity}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={showActivity ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notifications</Text>
              <View style={styles.settingsGroup}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Friend requests</Text>
                  <Switch
                    value={friendRequests}
                    onValueChange={setFriendRequests}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={friendRequests ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Event reminders</Text>
                  <Switch
                    value={eventReminders}
                    onValueChange={setEventReminders}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={eventReminders ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Friend activity</Text>
                  <Switch
                    value={friendActivity}
                    onValueChange={setFriendActivity}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={friendActivity ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Badges & achievements</Text>
                  <Switch
                    value={badgesNotif}
                    onValueChange={setBadgesNotif}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={badgesNotif ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account</Text>
              <View style={styles.accountActions}>
                <TouchableOpacity style={styles.accountButton}>
                  <Text style={styles.accountButtonText}>Edit Profile</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.accountButton}>
                  <Text style={styles.accountButtonText}>Change Password</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.accountButton}>
                  <Text style={[styles.accountButtonText, styles.dangerText]}>Delete Account</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileCard: {
    padding: 16,
    paddingTop: 48,
    marginBottom: 12,
  },
  profileTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGlow: {
    padding: 4,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary.main,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  username: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
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
  editButtonText: {
    fontSize: 13,
    color: 'white',
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  statusIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  socialStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    fontSize: 12,
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  streakCard: {
    backgroundColor: '#FEF3C7',
  },
  impactCard: {
    backgroundColor: '#F3E8FF',
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statEmoji: {
    fontSize: 32,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  overviewContent: {
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  activityItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  activityLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  badgesList: {
    gap: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  impactSummary: {
    backgroundColor: '#ECFDF5',
  },
  impactItems: {
    gap: 8,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memberSince: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  badgeCardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  badgeCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeCardDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsTable: {
    gap: 12,
  },
  statsTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  settingsGroup: {
    gap: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#374151',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerText: {
    fontSize: 14,
    color: '#374151',
  },
  accountActions: {
    gap: 8,
  },
  accountButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  accountButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  dangerText: {
    color: '#DC2626',
  },
});
