import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/firebase/auth.service';
import { db, COLLECTIONS } from '@/services/firebase/config';
import { AppColors } from '@/constants/colors';

// Helper to safely convert Firestore Timestamp to Date
function toJSDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'settings'>('overview');
  const [signingOut, setSigningOut] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Privacy settings from user data
  const [showOnlineStatus, setShowOnlineStatus] = useState(
    user?.privacySettings?.showOnlineStatus ?? true
  );
  const [showActivity, setShowActivity] = useState(
    user?.privacySettings?.showActivity ?? true
  );

  // Notification settings from user data
  const [friendRequestsNotif, setFriendRequestsNotif] = useState(
    user?.notificationSettings?.friendRequests ?? true
  );
  const [eventReminders, setEventReminders] = useState(
    user?.notificationSettings?.eventUpdates ?? true
  );
  const [friendActivityNotif, setFriendActivityNotif] = useState(
    user?.notificationSettings?.friendActivity ?? true
  );
  const [badgesNotif, setBadgesNotif] = useState(
    user?.notificationSettings?.badges ?? true
  );

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          if (!user?.id) return;
          setSigningOut(true);
          try {
            await AuthService.signOut(user.id);
            router.replace('/auth/sign-in');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to sign out');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const savePrivacySettings = async (field: string, value: boolean) => {
    if (!user?.id) return;
    setSavingSettings(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.id), {
        [`privacySettings.${field}`]: value,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Save privacy setting error:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const saveNotificationSetting = async (field: string, value: boolean) => {
    if (!user?.id) return;
    setSavingSettings(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.id), {
        [`notificationSettings.${field}`]: value,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Save notification setting error:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const displayName = user?.displayName || user?.username || 'User';
  const username = user?.username || 'user';
  const avatar = user?.avatar || '👤';
  const bio = user?.bio || 'GatherLah member';
  const friendsCount = user?.friendsCount || 0;
  const followersCount = user?.followersCount || 0;
  const followingCount = user?.followingCount || 0;
  const level = user?.level || 1;
  const xp = user?.experiencePoints || 0;
  const currentStreak = user?.currentStreak || 0;
  const longestStreak = user?.longestStreak || 0;
  const totalEventsJoined = user?.totalEventsJoined || 0;
  const totalEventsCreated = user?.totalEventsCreated || 0;
  const wellnessScore = user?.wellnessScore || 0;
  const createdAt = toJSDate(user?.createdAt);
  const profileVisibility = user?.privacySettings?.profileVisibility || 'public';
  const allowFriendRequests = user?.privacySettings?.allowFriendRequests || 'everyone';

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AppColors.primary.main} />
      </View>
    );
  }

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
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatar}</Text>
              </View>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.username}>@{username}</Text>
              </View>
            </View>
            <Text style={styles.bio}>{bio}</Text>

            {/* Level & XP */}
            <View style={styles.statusIndicators}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Level {level}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{xp} XP</Text>
              </View>
              {currentStreak > 0 && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>🔥 {currentStreak} days</Text>
                </View>
              )}
            </View>

            {/* Social Stats */}
            <View style={styles.socialStats}>
              <TouchableOpacity onPress={() => router.push('/friends' as any)}>
                <Text style={styles.statValue}>{friendsCount}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.statValue}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.statValue}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            {signingOut ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="logout" size={16} color="white" />
                <Text style={styles.actionButtonText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Streak & XP Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.streakCard]}>
          <View style={styles.statCardContent}>
            <Text style={styles.statEmoji}>🔥</Text>
            <View>
              <Text style={styles.statCardLabel}>Streak</Text>
              <Text style={styles.statCardValue}>{currentStreak} days</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statCard, styles.impactCard]}>
          <View style={styles.statCardContent}>
            <Text style={styles.statEmoji}>⭐</Text>
            <View>
              <Text style={styles.statCardLabel}>Experience</Text>
              <Text style={styles.statCardValue}>{xp} XP</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['overview', 'stats', 'settings'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
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
              <Text style={styles.cardTitle}>Activity</Text>
              <View style={styles.activityGrid}>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#2563EB" />
                  <View>
                    <Text style={styles.activityValue}>{totalEventsJoined}</Text>
                    <Text style={styles.activityLabel}>Events Joined</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
                  <View>
                    <Text style={styles.activityValue}>{totalEventsCreated}</Text>
                    <Text style={styles.activityLabel}>Events Hosted</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#8B5CF6" />
                  <View>
                    <Text style={styles.activityValue}>{friendsCount}</Text>
                    <Text style={styles.activityLabel}>Friends</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#10B981" />
                  <View>
                    <Text style={styles.activityValue}>{wellnessScore}</Text>
                    <Text style={styles.activityLabel}>Wellness</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Interests</Text>
                <View style={styles.interestTags}>
                  {user.interests.map((interest: string, i: number) => (
                    <View key={i} style={styles.interestTag}>
                      <Text style={styles.interestTagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Member Since */}
            <View style={styles.card}>
              <Text style={styles.memberSince}>
                Member since{' '}
                {createdAt
                  ? createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'recently'}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>All Time Stats</Text>
            <View style={styles.statsTable}>
              {[
                { label: 'Total Events Joined', value: String(totalEventsJoined) },
                { label: 'Events Hosted', value: String(totalEventsCreated) },
                { label: 'Friends', value: String(friendsCount) },
                { label: 'Followers', value: String(followersCount) },
                { label: 'Following', value: String(followingCount) },
                { label: 'Experience Points', value: `${xp} XP` },
                { label: 'Current Level', value: String(level) },
                { label: 'Current Streak', value: `${currentStreak} days` },
                { label: 'Longest Streak', value: `${longestStreak} days` },
                { label: 'Wellness Score', value: String(wellnessScore) },
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
                    <Text style={styles.pickerText}>
                      {profileVisibility.charAt(0).toUpperCase() + profileVisibility.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Friend Requests</Text>
                  <View style={styles.picker}>
                    <Text style={styles.pickerText}>
                      {allowFriendRequests === 'friendsOfFriends'
                        ? 'Friends of Friends'
                        : allowFriendRequests.charAt(0).toUpperCase() + allowFriendRequests.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show online status</Text>
                  <Switch
                    value={showOnlineStatus}
                    onValueChange={(val) => {
                      setShowOnlineStatus(val);
                      savePrivacySettings('showOnlineStatus', val);
                    }}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={showOnlineStatus ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show activity</Text>
                  <Switch
                    value={showActivity}
                    onValueChange={(val) => {
                      setShowActivity(val);
                      savePrivacySettings('showActivity', val);
                    }}
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
                    value={friendRequestsNotif}
                    onValueChange={(val) => {
                      setFriendRequestsNotif(val);
                      saveNotificationSetting('friendRequests', val);
                    }}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={friendRequestsNotif ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Event reminders</Text>
                  <Switch
                    value={eventReminders}
                    onValueChange={(val) => {
                      setEventReminders(val);
                      saveNotificationSetting('eventUpdates', val);
                    }}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={eventReminders ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Friend activity</Text>
                  <Switch
                    value={friendActivityNotif}
                    onValueChange={(val) => {
                      setFriendActivityNotif(val);
                      saveNotificationSetting('friendActivity', val);
                    }}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={friendActivityNotif ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Badges & achievements</Text>
                  <Switch
                    value={badgesNotif}
                    onValueChange={(val) => {
                      setBadgesNotif(val);
                      saveNotificationSetting('badges', val);
                    }}
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    thumbColor={badgesNotif ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account</Text>
              <View style={styles.accountActions}>
                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>Email</Text>
                  <Text style={styles.accountInfoValue}>{user.email}</Text>
                </View>
                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>Account Type</Text>
                  <Text style={styles.accountInfoValue}>
                    {(user.accountType || 'normal').charAt(0).toUpperCase() +
                      (user.accountType || 'normal').slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              {signingOut ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="logout" size={18} color="white" />
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </>
              )}
            </TouchableOpacity>
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
    width: '46%' as any,
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
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
  },
  memberSince: {
    fontSize: 14,
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
    flex: 1,
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
    gap: 12,
  },
  accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accountInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  accountInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
