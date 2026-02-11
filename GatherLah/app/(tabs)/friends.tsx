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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit as fbLimit } from 'firebase/firestore';
import { CustomBadge } from '@/components/ui/custom-badge';
import { FriendsAPI } from '@/services/api/friends.api';
import { auth, db, COLLECTIONS } from '@/services/firebase/config';
import { User } from '@/types/user.types';
import { FriendRequest, FriendRequestStatus, Friendship } from '@/types/social.types';
import { AppColors } from '@/constants/colors';

type FriendFilter = 'all' | 'online';

// Helper to convert Firestore Timestamp to Date
function toJSDate(val: any): Date {
  if (val instanceof Date) return val;
  if (val && typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
}

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FriendFilter>('all');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<(FriendRequest & { senderUser?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search for users to add as friends
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const userId = auth.currentUser?.uid;

  const fetchFriendsData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch friends from subcollection
      const friendsSnap = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/friends`));
      const friendships = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));

      // Get friend user profiles
      const friendProfiles: User[] = [];
      for (const f of friendships) {
        const friendId = f.userId1 === userId ? f.userId2 : f.userId1;
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, friendId));
        if (userDoc.exists()) {
          friendProfiles.push({ id: userDoc.id, ...userDoc.data() } as User);
        }
      }
      setFriends(friendProfiles);

      // Fetch pending friend requests received by this user
      const requestsQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('receiverId', '==', userId),
        where('status', '==', FriendRequestStatus.PENDING)
      );
      const requestsSnap = await getDocs(requestsQuery);
      const requests: (FriendRequest & { senderUser?: User })[] = [];
      for (const d of requestsSnap.docs) {
        const req = { id: d.id, ...d.data() } as FriendRequest;
        // Fetch sender's profile
        const senderDoc = await getDoc(doc(db, COLLECTIONS.USERS, req.senderId));
        if (senderDoc.exists()) {
          requests.push({ ...req, senderUser: { id: senderDoc.id, ...senderDoc.data() } as User });
        } else {
          requests.push(req);
        }
      }
      setPendingRequests(requests);
    } catch (err: any) {
      console.error('Fetch friends error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchFriendsData();
    }, [userId])
  );

  // Search users by username or display name
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Search by username (prefix match)
      const usernameQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('username', '>=', text.toLowerCase()),
        where('username', '<=', text.toLowerCase() + '\uf8ff'),
        fbLimit(10)
      );
      const snap = await getDocs(usernameQuery);
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as User))
        .filter(u => u.id !== userId && !friends.some(f => f.id === u.id));
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

  const handleSendRequest = async (receiverId: string) => {
    if (!userId) return;
    setActionLoading(receiverId);
    try {
      await FriendsAPI.sendFriendRequest(userId, receiverId);
      Alert.alert('Sent!', 'Friend request sent.');
      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!userId) return;
    Alert.alert('Remove Friend', 'Are you sure?', [
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

  // Filter friends
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = searchQuery.length < 2 || // only filter when actively searching
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'online' && friend.isOnline);

    return matchesSearch && matchesFilter;
  });

  const onlineCount = friends.filter(f => f.isOnline).length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AppColors.accent.main} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={AppColors.gradients.green}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{friends.length} friends</Text>
          <View style={styles.dot} />
          <Text style={styles.statsText}>{onlineCount} online</Text>
        </View>
      </LinearGradient>

      {/* Friend Requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <CustomBadge variant="error" size="sm">
              {pendingRequests.length}
            </CustomBadge>
          </View>
          {pendingRequests.map(request => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestAvatar}>
                  {request.senderUser?.avatar || '👤'}
                </Text>
                <View style={styles.requestDetails}>
                  <Text style={styles.requestName}>
                    {request.senderUser?.displayName || 'Unknown'}
                  </Text>
                  <Text style={styles.requestUsername}>
                    @{request.senderUser?.username || '???'}
                  </Text>
                  {request.context && (
                    <Text style={styles.requestContext}>{request.context}</Text>
                  )}
                </View>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(request.id)}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialCommunityIcons name="check" size={20} color="white" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleRejectRequest(request.id)}
                  disabled={actionLoading === request.id}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends or find users..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
              All ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'online' && styles.filterTabActive]}
            onPress={() => setActiveFilter('online')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'online' && styles.filterTabTextActive]}>
              Online ({onlineCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results (users to add) */}
      {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
        <View style={styles.suggestionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Friends</Text>
          </View>
          {searchResults.map(user => (
            <View key={user.id} style={styles.suggestionCard}>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionAvatar}>{user.avatar || '👤'}</Text>
                <View style={styles.suggestionDetails}>
                  <Text style={styles.suggestionName}>{user.displayName}</Text>
                  <Text style={styles.suggestionUsername}>@{user.username}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleSendRequest(user.id)}
                disabled={actionLoading === user.id}
              >
                {actionLoading === user.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons name="account-plus" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {searching && (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={AppColors.accent.main} />
        </View>
      )}

      {/* Friends List */}
      <View style={styles.friendsSection}>
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {friends.length === 0 ? 'No friends yet' : 'No friends found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {friends.length === 0
                ? 'Search for users above to add friends'
                : 'Try adjusting your search or filters'}
            </Text>
          </View>
        ) : (
          filteredFriends.map(friend => (
            <TouchableOpacity key={friend.id} style={styles.friendCard}>
              <View style={styles.friendInfo}>
                <View style={styles.friendAvatarContainer}>
                  <Text style={styles.friendAvatar}>{friend.avatar || '👤'}</Text>
                  {friend.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.friendDetails}>
                  <Text style={styles.friendName}>{friend.displayName}</Text>
                  <Text style={styles.friendUsername}>@{friend.username}</Text>
                  {friend.isOnline ? (
                    <View style={styles.activityBadge}>
                      <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
                      <Text style={styles.activityText}>Online now</Text>
                    </View>
                  ) : friend.lastSeen ? (
                    <Text style={styles.lastSeen}>
                      Last seen {toJSDate(friend.lastSeen).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => handleRemoveFriend(friend.id)}
              >
                <MaterialCommunityIcons name="account-remove" size={20} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>

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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  requestsSection: {
    backgroundColor: '#FEF2F2',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  requestAvatar: {
    fontSize: 32,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  requestUsername: {
    fontSize: 13,
    color: '#6B7280',
  },
  requestContext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  filterTabTextActive: {
    color: 'white',
  },
  friendsSection: {
    padding: 16,
  },
  friendCard: {
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
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  friendAvatarContainer: {
    position: 'relative',
  },
  friendAvatar: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  friendUsername: {
    fontSize: 13,
    color: '#6B7280',
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  activityText: {
    fontSize: 12,
    color: '#10B981',
  },
  lastSeen: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  suggestionsSection: {
    padding: 16,
    paddingBottom: 0,
  },
  suggestionCard: {
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
  suggestionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  suggestionAvatar: {
    fontSize: 32,
  },
  suggestionDetails: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  suggestionUsername: {
    fontSize: 13,
    color: '#6B7280',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 24,
  },
});
