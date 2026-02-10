import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomBadge } from '@/components/ui/custom-badge';
import { mockEvents, mockUsers } from '@/constants/mockData';
import { CategoryColors, AppColors } from '@/constants/colors';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chats' | 'posts' | 'entries' | 'members'>('chats');
  const [postMessage, setPostMessage] = useState('');

  const event = mockEvents.find(e => e.id === id);

  if (!event) {
    return (
      <View style={styles.container}>
        <Text>Event not found</Text>
      </View>
    );
  }

  const startTime = new Date(event.startTime);
  const attendees = [...event.friendsAttending, ...mockUsers.slice(0, 3)];
  const categoryColor = CategoryColors[event.type as keyof typeof CategoryColors];

  const groupChats = [
    { id: 1, name: 'Main Discussion', members: 5, maxMembers: 5, messages: 23 },
    { id: 2, name: 'Random Chat', members: 4, maxMembers: 5, messages: 12 },
    { id: 3, name: 'Beginner Group', members: 3, maxMembers: 5, messages: 8 },
  ];

  const posts = [
    { user: mockUsers[0], content: "Can't wait to get started! Anyone else excited?", time: '5 mins ago', likes: 3 },
    { user: mockUsers[1], content: 'First time joining this type of event. Any tips?', time: '12 mins ago', likes: 5 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <MaterialCommunityIcons name="share-variant" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Header with Gradient */}
        <LinearGradient
          colors={[categoryColor.bg, 'white']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.eventHeader}
        >
          <View style={styles.badges}>
            {event.isLive && (
              <CustomBadge variant="error">● LIVE NOW</CustomBadge>
            )}
            <CustomBadge variant="info">{event.type}</CustomBadge>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>

          {/* Event Meta */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#9CA3AF" />
              <Text style={styles.metaText}>
                {startTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="account-group" size={20} color="#9CA3AF" />
              <Text style={styles.metaText}>{event.participants}/{event.maxParticipants} joined</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#9CA3AF" />
              <Text style={[styles.metaText, { textTransform: 'capitalize' }]}>{event.location}</Text>
            </View>
          </View>

          {/* Host */}
          <View style={styles.hostContainer}>
            <Text style={styles.hostEmoji}>{event.host.avatar}</Text>
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{event.host.name}</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <MaterialCommunityIcons name="account-plus" size={16} color="#374151" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Friends Attending */}
          {event.friendsAttending.length > 0 && (
            <View style={styles.friendsContainer}>
              <Text style={styles.friendsText}>
                👥 {event.friendsAttending.length} friends attending
              </Text>
              <View style={styles.friendsAvatars}>
                {event.friendsAttending.slice(0, 5).map(friend => (
                  <View key={friend.id} style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                  </View>
                ))}
                {event.friendsAttending.length > 5 && (
                  <View style={[styles.friendAvatar, styles.friendAvatarMore]}>
                    <Text style={styles.friendAvatarMoreText}>+{event.friendsAttending.length - 5}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            style={[styles.actionButton, event.isLive && styles.actionButtonLive]}
          >
            <Text style={styles.actionButtonText}>
              {event.isLive ? '🎉 Join Now' : '✓ Joined - View Details'}
            </Text>
          </Pressable>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['chats', 'posts', 'entries', 'members'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'chats' && (
            <View>
              <Text style={styles.tabDescription}>
                Join a group chat to connect with other participants
              </Text>
              {groupChats.map(chat => (
                <View key={chat.id} style={styles.chatCard}>
                  <View style={styles.chatHeader}>
                    <View style={styles.chatInfo}>
                      <View style={styles.chatTitleRow}>
                        <MaterialCommunityIcons name="message-text" size={20} color="#2563EB" />
                        <Text style={styles.chatName}>{chat.name}</Text>
                      </View>
                      <Text style={styles.chatMessages}>{chat.messages} messages</Text>
                    </View>
                    <View style={styles.chatMeta}>
                      <CustomBadge variant="outline" size="sm">
                        {chat.members}/{chat.maxMembers}
                      </CustomBadge>
                      <Text style={styles.chatMetaLabel}>members</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.joinChatButton,
                      chat.members === chat.maxMembers && styles.joinChatButtonDisabled,
                    ]}
                    disabled={chat.members === chat.maxMembers}
                  >
                    <Text style={styles.joinChatButtonText}>
                      {chat.members === chat.maxMembers ? 'Full' : 'Join Chat'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'posts' && (
            <View>
              <View style={styles.postInputContainer}>
                <TextInput
                  style={styles.postInput}
                  placeholder="Share your thoughts..."
                  value={postMessage}
                  onChangeText={setPostMessage}
                />
                <TouchableOpacity style={styles.sendButton}>
                  <MaterialCommunityIcons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
              {posts.map((post, i) => (
                <View key={i} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Text style={styles.postAvatar}>{post.user.avatar}</Text>
                    <View style={styles.postUserInfo}>
                      <Text style={styles.postUserName}>{post.user.name}</Text>
                      <Text style={styles.postTime}>{post.time}</Text>
                    </View>
                  </View>
                  <Text style={styles.postContent}>{post.content}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.postAction}>
                      <Text>❤️ {post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={styles.postActionText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'entries' && (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyTabText}>No entries yet</Text>
              <Text style={styles.emptyTabSubtext}>Share your work when the event starts!</Text>
            </View>
          )}

          {activeTab === 'members' && (
            <View>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>All Members ({attendees.length})</Text>
                <TouchableOpacity>
                  <Text style={styles.filterLink}>Filter</Text>
                </TouchableOpacity>
              </View>
              {attendees.map(user => (
                <View key={user.id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatarContainer}>
                      <Text style={styles.memberAvatar}>{user.avatar}</Text>
                      {user.isOnline && <View style={styles.onlineIndicator} />}
                    </View>
                    <View style={styles.memberDetails}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{user.name}</Text>
                        {user.isFriend && (
                          <CustomBadge variant="outline" size="sm">Friend</CustomBadge>
                        )}
                      </View>
                      <Text style={styles.memberUsername}>@{user.username}</Text>
                    </View>
                  </View>
                  {!user.isFriend && (
                    <TouchableOpacity style={styles.memberAddButton}>
                      <Text style={styles.memberAddButtonText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginLeft: 12,
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  eventHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  metaContainer: {
    gap: 12,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#374151',
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  hostEmoji: {
    fontSize: 32,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  friendsContainer: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  friendsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  friendsAvatars: {
    flexDirection: 'row',
    gap: -8,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 18,
  },
  friendAvatarMore: {
    backgroundColor: '#E5E7EB',
  },
  friendAvatarMoreText: {
    fontSize: 10,
    color: '#374151',
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonLive: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  tabContent: {
    padding: 16,
  },
  tabDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  chatCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatMessages: {
    fontSize: 14,
    color: '#6B7280',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatMetaLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  joinChatButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinChatButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  joinChatButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  postInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  postInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  postAvatar: {
    fontSize: 24,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  postTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTab: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTabText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyTabSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  filterLink: {
    fontSize: 14,
    color: '#2563EB',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: 'white',
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memberUsername: {
    fontSize: 12,
    color: '#6B7280',
  },
  memberAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberAddButtonText: {
    fontSize: 14,
    color: '#374151',
  },
});
