import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, getDoc, doc, limit as fbLimit } from 'firebase/firestore';
import { CustomBadge } from '@/components/ui/custom-badge';
import { FriendsAPI } from '@/services/api/friends.api';
import { useAuth } from '@/contexts/AuthContext';
import { db, COLLECTIONS } from '@/services/firebase/config';
import { User } from '@/types/user.types';
import { FriendRequest, FriendRequestStatus, Friendship } from '@/types/social.types';
import { AppColors } from '@/constants/colors';
import { seedSampleUsers } from '@/services/data/seed-users';

type ActiveTab = 'friends' | 'requests' | 'discover';
type FriendFilter = 'all' | 'online';
type SuggestionUser = User & { mutualCount?: number; sharedInterests?: string[] };

function toJSDate(val: any): Date {
  if (val instanceof Date) return val;
  if (val && typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
  const [friendFilter, setFriendFilter] = useState<FriendFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Friends tab state
  const [friends, setFriends] = useState<User[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // Requests tab state
  const [pendingRequests, setPendingRequests] = useState<(FriendRequest & { senderUser?: User })[]>([]);
  const [sentRequests, setSentRequests] = useState<(FriendRequest & { receiverUser?: User })[]>([]);

  // Discover tab state
  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch all friends data
  const fetchFriendsData = async () => {
    if (!userId) return;
    try {
      // Fetch friends from subcollection
      const friendsSnap = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/friends`));
      const friendships = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));

      const friendProfiles: User[] = [];
      for (const f of friendships) {
        const friendId = f.userId1 === userId ? f.userId2 : f.userId1;
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, friendId));
        if (userDoc.exists()) {
          friendProfiles.push({ id: userDoc.id, ...userDoc.data() } as User);
        }
      }
      setFriends(friendProfiles);

      // Fetch incoming pending requests
      const incomingQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('receiverId', '==', userId),
        where('status', '==', FriendRequestStatus.PENDING)
      );
      const incomingSnap = await getDocs(incomingQuery);
      const incoming: (FriendRequest & { senderUser?: User })[] = [];
      for (const d of incomingSnap.docs) {
        const req = { id: d.id, ...d.data() } as FriendRequest;
        const senderDoc = await getDoc(doc(db, COLLECTIONS.USERS, req.senderId));
        if (senderDoc.exists()) {
          incoming.push({ ...req, senderUser: { id: senderDoc.id, ...senderDoc.data() } as User });
        } else {
          incoming.push(req);
        }
      }
      setPendingRequests(incoming);

      // Fetch sent pending requests
      const sent = await FriendsAPI.getSentRequests(userId);
      setSentRequests(sent);
    } catch (err: any) {
      console.error('Fetch friends error:', err);
    }
  };

  const fetchSuggestions = async () => {
    if (!userId) return;
    setSuggestionsLoading(true);
    try {
      // Auto-seed sample users silently so there's always content
      try { await seedSampleUsers(); } catch (_) { /* ignore seed errors */ }

      const results = await FriendsAPI.getFriendSuggestions(userId, 15);
      setSuggestions(results);
    } catch (err: any) {
      console.error('Fetch suggestions error:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchFriendsData(), fetchSuggestions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [userId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFriendsData(), fetchSuggestions()]);
    setRefreshing(false);
  };

  // Search for users by username
  const handleUserSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const usernameQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('username', '>=', text.toLowerCase()),
        where('username', '<=', text.toLowerCase() + '\uf8ff'),
        fbLimit(10)
      );
      const snap = await getDocs(usernameQuery);
      const sentIds = new Set(sentRequests.map(r => r.receiverId));
      const friendIds = new Set(friends.map(f => f.id));
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as User))
        .filter(u => u.id !== userId && !friendIds.has(u.id) && !sentIds.has(u.id));
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await FriendsAPI.acceptFriendRequest(requestId);
      await fetchFriendsData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await FriendsAPI.rejectFriendRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await FriendsAPI.cancelFriendRequest(requestId);
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!userId) return;
    setActionLoading(receiverId);
    try {
      await FriendsAPI.sendFriendRequest(userId, receiverId);
      Alert.alert('Sent!', 'Friend request sent.');
      // Remove from search results and suggestions
      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
      setSuggestions(prev => prev.filter(u => u.id !== receiverId));
      // Refresh sent requests
      const sent = await FriendsAPI.getSentRequests(userId);
      setSentRequests(sent);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!userId) return;
    Alert.alert('Remove Friend', 'Are you sure you want to remove this friend?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(friendId);
          try {
            await FriendsAPI.removeFriend(userId, friendId);
            setFriends(prev => prev.filter(f => f.id !== friendId));
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  // Filtered friends
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friendSearchQuery.length < 2 ||
      friend.displayName?.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
      friend.username?.toLowerCase().includes(friendSearchQuery.toLowerCase());
    const matchesFilter = friendFilter === 'all' || (friendFilter === 'online' && friend.isOnline);
    return matchesSearch && matchesFilter;
  });

  const onlineCount = friends.filter(f => f.isOnline).length;
  const totalRequestCount = pendingRequests.length + sentRequests.length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AppColors.primary.main} />
      </View>
    );
  }

  // ---- Render Helpers ----

  const renderFriendsTab = () => (
    <View>
      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your friends..."
            placeholderTextColor="#9CA3AF"
            value={friendSearchQuery}
            onChangeText={setFriendSearchQuery}
          />
          {friendSearchQuery !== '' && (
            <TouchableOpacity onPress={() => setFriendSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {(['all', 'online'] as FriendFilter[]).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, friendFilter === filter && styles.filterChipActive]}
              onPress={() => setFriendFilter(filter)}
            >
              {filter === 'online' && (
                <View style={[styles.onlineDot, friendFilter === 'online' && { backgroundColor: '#fff' }]} />
              )}
              <Text style={[styles.filterChipText, friendFilter === filter && styles.filterChipTextActive]}>
                {filter === 'all' ? `All (${friends.length})` : `Online (${onlineCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Friends List */}
      <View style={styles.listSection}>
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {friends.length === 0 ? 'No friends yet' : 'No friends found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {friends.length === 0
                ? 'Go to the Discover tab to find people!'
                : 'Try adjusting your search or filters'}
            </Text>
          </View>
        ) : (
          filteredFriends.map(friend => (
            <TouchableOpacity key={friend.id} style={styles.userCard} activeOpacity={0.7}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{friend.avatar || '👤'}</Text>
                  {friend.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{friend.displayName}</Text>
                  <Text style={styles.userHandle}>@{friend.username}</Text>
                  {friend.isOnline ? (
                    <View style={styles.statusRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusOnline}>Online now</Text>
                    </View>
                  ) : friend.lastSeen ? (
                    <Text style={styles.statusOffline}>
                      Last seen {toJSDate(friend.lastSeen).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveFriend(friend.id)}
                disabled={actionLoading === friend.id}
              >
                {actionLoading === friend.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <MaterialCommunityIcons name="account-remove" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderRequestsTab = () => (
    <View>
      {/* Incoming Requests */}
      <View style={styles.listSection}>
        <View style={styles.subSectionHeader}>
          <View style={styles.subSectionTitleRow}>
            <MaterialCommunityIcons name="account-arrow-left" size={20} color={AppColors.primary.main} />
            <Text style={styles.subSectionTitle}>Received</Text>
          </View>
          {pendingRequests.length > 0 && (
            <CustomBadge variant="error" size="sm">
              {pendingRequests.length}
            </CustomBadge>
          )}
        </View>

        {pendingRequests.length === 0 ? (
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniText}>No pending requests</Text>
          </View>
        ) : (
          pendingRequests.map(request => (
            <View key={request.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.avatarText}>{request.senderUser?.avatar || '👤'}</Text>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{request.senderUser?.displayName || 'Unknown'}</Text>
                  <Text style={styles.userHandle}>@{request.senderUser?.username || '???'}</Text>
                  {request.context && (
                    <Text style={styles.requestContext}>{request.context}</Text>
                  )}
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptRequest(request.id)}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialCommunityIcons name="check" size={18} color="white" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => handleRejectRequest(request.id)}
                  disabled={actionLoading === request.id}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Sent Requests */}
      <View style={styles.listSection}>
        <View style={styles.subSectionHeader}>
          <View style={styles.subSectionTitleRow}>
            <MaterialCommunityIcons name="account-arrow-right" size={20} color={AppColors.secondary.main} />
            <Text style={styles.subSectionTitle}>Sent</Text>
          </View>
          {sentRequests.length > 0 && (
            <Text style={styles.sentCount}>{sentRequests.length} pending</Text>
          )}
        </View>

        {sentRequests.length === 0 ? (
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniText}>No sent requests</Text>
          </View>
        ) : (
          sentRequests.map(request => (
            <View key={request.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.avatarText}>{request.receiverUser?.avatar || '👤'}</Text>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{request.receiverUser?.displayName || 'Unknown'}</Text>
                  <Text style={styles.userHandle}>@{request.receiverUser?.username || '???'}</Text>
                  <Text style={styles.pendingLabel}>Pending...</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelRequest(request.id)}
                disabled={actionLoading === request.id}
              >
                {actionLoading === request.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderDiscoverTab = () => (
    <View>
      {/* Search Users */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleUserSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searching && (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={AppColors.primary.main} />
        </View>
      )}

      {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.subSectionHeader}>
            <View style={styles.subSectionTitleRow}>
              <MaterialCommunityIcons name="magnify" size={20} color={AppColors.primary.main} />
              <Text style={styles.subSectionTitle}>Search Results</Text>
            </View>
          </View>
          {searchResults.map(u => (
            <View key={u.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.avatarText}>{u.avatar || '👤'}</Text>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{u.displayName}</Text>
                  <Text style={styles.userHandle}>@{u.username}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleSendRequest(u.id)}
                disabled={actionLoading === u.id}
              >
                {actionLoading === u.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons name="account-plus" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
        <View style={styles.emptyMini}>
          <Text style={styles.emptyMiniText}>No users found for "{searchQuery}"</Text>
        </View>
      )}

      {/* Friend Suggestions */}
      <View style={styles.listSection}>
        <View style={styles.subSectionHeader}>
          <View style={styles.subSectionTitleRow}>
            <MaterialCommunityIcons name="account-star" size={20} color={AppColors.secondary.main} />
            <Text style={styles.subSectionTitle}>People You May Know</Text>
          </View>
          <TouchableOpacity onPress={fetchSuggestions} disabled={suggestionsLoading}>
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={suggestionsLoading ? '#D1D5DB' : AppColors.primary.main}
            />
          </TouchableOpacity>
        </View>

        {suggestionsLoading ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={AppColors.primary.main} />
            <Text style={[styles.emptyMiniText, { marginTop: 8 }]}>Finding suggestions...</Text>
          </View>
        ) : suggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No suggestions yet</Text>
            <Text style={styles.emptySubtext}>
              Add interests to your profile to get personalized suggestions. Pull down to refresh!
            </Text>
          </View>
        ) : (
          suggestions.map(s => (
            <View key={s.id} style={styles.suggestionCard}>
              <View style={styles.userInfo}>
                <View style={styles.suggestionAvatarWrap}>
                  <Text style={styles.suggestionAvatarLarge}>{s.avatar || '👤'}</Text>
                  {s.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.suggestionNameRow}>
                    <Text style={styles.userName}>{s.displayName}</Text>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>Lv.{s.level || 1}</Text>
                    </View>
                  </View>
                  <Text style={styles.userHandle}>@{s.username}</Text>
                  {s.bio ? (
                    <Text style={styles.suggestionBio} numberOfLines={1}>{s.bio}</Text>
                  ) : null}
                  {/* Mutual friends & shared interests */}
                  <View style={styles.suggestionMeta}>
                    {(s.mutualCount || 0) > 0 && (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="account-multiple" size={12} color={AppColors.primary.main} />
                        <Text style={styles.metaChipText}>
                          {s.mutualCount} mutual
                        </Text>
                      </View>
                    )}
                    {(s.sharedInterests?.length || 0) > 0 && (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="heart" size={12} color={AppColors.secondary.main} />
                        <Text style={styles.metaChipText}>
                          {s.sharedInterests!.length} shared interest{s.sharedInterests!.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {s.totalEventsJoined ? (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="calendar-check" size={12} color="#10B981" />
                        <Text style={styles.metaChipText}>{s.totalEventsJoined} events</Text>
                      </View>
                    ) : null}
                  </View>
                  {/* Show first few shared interests as tags */}
                  {(s.sharedInterests?.length || 0) > 0 && (
                    <View style={styles.interestTags}>
                      {s.sharedInterests!.slice(0, 3).map((interest, i) => (
                        <View key={i} style={styles.interestTag}>
                          <Text style={styles.interestTagText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleSendRequest(s.id)}
                disabled={actionLoading === s.id}
              >
                {actionLoading === s.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons name="account-plus" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary.main]} />}
    >
      {/* Header */}
      <LinearGradient
        colors={AppColors.primary.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{friends.length}</Text>
            <Text style={styles.headerStatLabel}>Friends</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{onlineCount}</Text>
            <Text style={styles.headerStatLabel}>Online</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{pendingRequests.length}</Text>
            <Text style={styles.headerStatLabel}>Requests</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {([
          { key: 'friends' as ActiveTab, label: 'Friends', icon: 'account-group' as const },
          { key: 'requests' as ActiveTab, label: 'Requests', icon: 'account-clock' as const, badge: totalRequestCount },
          { key: 'discover' as ActiveTab, label: 'Discover', icon: 'compass' as const },
        ]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={styles.tabContent}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? AppColors.primary.main : '#9CA3AF'}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'friends' && renderFriendsTab()}
      {activeTab === 'requests' && renderRequestsTab()}
      {activeTab === 'discover' && renderDiscoverTab()}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatNum: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Tab Bar
  tabBar: {
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
    borderBottomColor: AppColors.primary.main,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: AppColors.primary.main,
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },

  // Search
  searchSection: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary.main,
    borderColor: AppColors.primary.main,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: 'white',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },

  // List Section
  listSection: {
    padding: 16,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sentCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // User Card (shared for friends, requests, search results)
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  userHandle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusOnline: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  statusOffline: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Request context
  requestContext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  pendingLabel: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 2,
  },

  // Suggestion Card
  suggestionAvatarWrap: {
    position: 'relative',
  },
  suggestionAvatarLarge: {
    fontSize: 36,
  },
  suggestionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary.main,
  },
  suggestionBio: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  suggestionMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaChipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  interestTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  interestTagText: {
    fontSize: 10,
    color: AppColors.primary.main,
    fontWeight: '600',
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyMini: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyMiniText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  bottomSpacing: {
    height: 32,
  },
});
