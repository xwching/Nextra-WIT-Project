import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomBadge } from '@/components/ui/custom-badge';
import { mockUsers, friendRequests } from '@/constants/mockData';
import { AppColors } from '@/constants/colors';

type FriendFilter = 'all' | 'online' | 'close';

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FriendFilter>('all');

  // Separate friends based on whether they're actually friends
  const friends = mockUsers.filter(u => u.isFriend);
  const suggestions = mockUsers.filter(u => !u.isFriend).slice(0, 3);

  // Filter friends based on active filter and search
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = searchQuery === '' ||
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'online' && friend.isOnline) ||
      (activeFilter === 'close' && friend.isCloseFriend);

    return matchesSearch && matchesFilter;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
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
          <Text style={styles.statsText}>
            {friends.filter(f => f.isOnline).length} online
          </Text>
        </View>
      </LinearGradient>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <CustomBadge variant="error" size="sm">
              {friendRequests.length}
            </CustomBadge>
          </View>
          {friendRequests.map(request => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestAvatar}>{request.user.avatar}</Text>
                <View style={styles.requestDetails}>
                  <Text style={styles.requestName}>{request.user.name}</Text>
                  <Text style={styles.requestUsername}>@{request.user.username}</Text>
                  {request.context && (
                    <Text style={styles.requestContext}>{request.context}</Text>
                  )}
                  <Text style={styles.requestTime}>{request.sentAt}</Text>
                </View>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity style={styles.acceptButton}>
                  <MaterialCommunityIcons name="check" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineButton}>
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
            placeholder="Search friends..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
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
              Online ({friends.filter(f => f.isOnline).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'close' && styles.filterTabActive]}
            onPress={() => setActiveFilter('close')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'close' && styles.filterTabTextActive]}>
              Close ({friends.filter(f => f.isCloseFriend).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Friends List */}
      <View style={styles.friendsSection}>
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No friends found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          filteredFriends.map(friend => (
            <TouchableOpacity key={friend.id} style={styles.friendCard}>
              <View style={styles.friendInfo}>
                <View style={styles.friendAvatarContainer}>
                  <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                  {friend.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.friendDetails}>
                  <View style={styles.friendNameRow}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    {friend.isCloseFriend && (
                      <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    )}
                  </View>
                  <Text style={styles.friendUsername}>@{friend.username}</Text>
                  {friend.currentActivity ? (
                    <View style={styles.activityBadge}>
                      <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
                      <Text style={styles.activityText}>{friend.currentActivity}</Text>
                    </View>
                  ) : friend.lastSeen ? (
                    <Text style={styles.lastSeen}>Last seen {friend.lastSeen}</Text>
                  ) : null}
                  {friend.friendsSince && (
                    <Text style={styles.friendsSince}>Friends for {friend.friendsSince}</Text>
                  )}
                </View>
              </View>
              <View style={styles.friendActions}>
                <TouchableOpacity style={styles.messageButton}>
                  <MaterialCommunityIcons name="message-text" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                  <MaterialCommunityIcons name="dots-horizontal" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Suggestions */}
      {!searchQuery && activeFilter === 'all' && suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People You May Know</Text>
          </View>
          {suggestions.map(user => (
            <View key={user.id} style={styles.suggestionCard}>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionAvatar}>{user.avatar}</Text>
                <View style={styles.suggestionDetails}>
                  <Text style={styles.suggestionName}>{user.name}</Text>
                  <Text style={styles.suggestionUsername}>@{user.username}</Text>
                  <Text style={styles.suggestionBio} numberOfLines={1}>
                    {user.bio}
                  </Text>
                  {user.mutualFriends && (
                    <Text style={styles.mutualFriends}>
                      {user.mutualFriends} mutual friends
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <MaterialCommunityIcons name="account-plus" size={20} color="white" />
              </TouchableOpacity>
            </View>
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
  requestTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
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
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  friendsSince: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
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
  },
  suggestionsSection: {
    padding: 16,
    paddingTop: 0,
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
  suggestionBio: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  mutualFriends: {
    fontSize: 11,
    color: '#2563EB',
    marginTop: 4,
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
