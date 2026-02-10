import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated } from 'react-native';
import { Event } from '@/constants/mockData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CategoryColors } from '@/constants/colors';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const eventTypeIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  creative: 'palette',
  tech: 'code-tags',
  games: 'gamepad-variant',
  social: 'message-text',
  learning: 'book-open-page-variant',
  activity: 'run',
  community: 'heart',
};

export function EventCard({ event, onPress }: EventCardProps) {
  const icon = eventTypeIcons[event.type];
  const categoryColor = CategoryColors[event.type as keyof typeof CategoryColors];
  const startTime = new Date(event.startTime);
  const now = new Date();
  const timeUntil = Math.floor((startTime.getTime() - now.getTime()) / 60000);

  // Pulse animation for live indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (event.isLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [event.isLive]);

  const formatTime = () => {
    if (event.isLive) return 'LIVE NOW';
    if (timeUntil < 60) return `in ${timeUntil} mins`;
    if (timeUntil < 1440) return `in ${Math.floor(timeUntil / 60)} hours`;
    return startTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Pressable
      style={[
        styles.card,
        event.isLive && styles.liveCard,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(124, 58, 237, 0.1)' }}
    >
      <View style={styles.content}>
        {/* Event Icon with Category Color */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: categoryColor.bg }
        ]}>
          <MaterialCommunityIcons
            name={icon}
            size={30}
            color={categoryColor.main}
          />
          {event.isLive && (
            <Animated.View
              style={[
                styles.liveIndicatorIcon,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={styles.livePulse} />
            </Animated.View>
          )}
        </View>

        {/* Event Details */}
        <View style={styles.details}>
          <View style={styles.header}>
            {event.isLive && (
              <View style={[styles.liveBadge, { backgroundColor: '#FEE2E2' }]}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            )}
            <Text style={[
              styles.timeText,
              event.isLive && styles.liveTimeText
            ]}>
              {formatTime()}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>

          <View style={styles.footer}>
            <View style={styles.participants}>
              <View style={[styles.participantsBadge, { backgroundColor: categoryColor.light }]}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={12}
                  color={categoryColor.main}
                />
                <Text style={[styles.participantsText, { color: categoryColor.main }]}>
                  {event.participants}/{event.maxParticipants}
                </Text>
              </View>
            </View>
            {event.friendsAttending.length > 0 && (
              <View style={styles.friends}>
                <View style={styles.friendsAvatars}>
                  {event.friendsAttending.slice(0, 3).map((friend, i) => (
                    <View key={friend.id} style={[styles.friendAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                      <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.friendsText}>
                  +{event.friendsAttending.length}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(124, 58, 237, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  liveCard: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  liveIndicatorIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  details: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  liveTimeText: {
    color: '#EF4444',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  participantsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  friends: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendsAvatars: {
    flexDirection: 'row',
  },
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 12,
  },
  friendsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
