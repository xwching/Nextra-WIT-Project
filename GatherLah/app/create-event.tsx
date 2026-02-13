import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EventsAPI } from '@/services/api/events.api';
import { auth } from '@/services/firebase/config';
import { EventType } from '@/types/event.types';
import { AppColors } from '@/constants/colors';

const EVENT_TYPES = [
  { value: EventType.CREATIVE, label: 'Creative', icon: 'palette', color: '#EC4899' },
  { value: EventType.TECH, label: 'Tech', icon: 'code-tags', color: '#3B82F6' },
  { value: EventType.GAMES, label: 'Games', icon: 'gamepad-variant', color: '#8B5CF6' },
  { value: EventType.SOCIAL, label: 'Social', icon: 'account-group', color: '#10B981' },
  { value: EventType.LEARNING, label: 'Learning', icon: 'book-open-page-variant', color: '#F59E0B' },
  { value: EventType.ACTIVITY, label: 'Activity', icon: 'run', color: '#EF4444' },
  { value: EventType.COMMUNITY, label: 'Community', icon: 'heart', color: '#06B6D4' },
];

const LOCATION_TYPES = [
  { value: 'online' as const, label: 'Online', icon: 'laptop' },
  { value: 'in-person' as const, label: 'In-Person', icon: 'map-marker' },
  { value: 'hybrid' as const, label: 'Hybrid', icon: 'lan-connect' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>(EventType.SOCIAL);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationType, setLocationType] = useState<'online' | 'in-person' | 'hybrid'>('in-person');
  const [locationDetails, setLocationDetails] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isKidFriendly, setIsKidFriendly] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCompetition, setIsCompetition] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [rulesInput, setRulesInput] = useState('');

  const setQuickDate = (daysFromNow: number, hour: number, minute: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setStartDate(`${y}-${m}-${d}`);
    setStartTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);

    // Auto-set end time 2 hours later
    const endHour = hour + 2;
    setEndDate(`${y}-${m}-${d}`);
    setEndTime(`${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const handleCreateEvent = async () => {
    setError('');

    // Validate required fields
    if (!title.trim()) {
      setError('Please enter an event title');
      return;
    }
    if (!description.trim()) {
      setError('Please enter an event description');
      return;
    }
    if (!startDate || !startTime) {
      setError('Please enter a start date and time');
      return;
    }
    if (!endDate || !endTime) {
      setError('Please enter an end date and time');
      return;
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      setError('Date format must be YYYY-MM-DD');
      return;
    }
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      setError('Time format must be HH:MM');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setError('Invalid date or time values');
      return;
    }
    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return;
    }

    // Check user is logged in
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to create an event');
      return;
    }

    setLoading(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const rules = rulesInput.split('\n').map(r => r.trim()).filter(Boolean);

      const eventData: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        type: eventType,
        startTime: startDateTime,
        endTime: endDateTime,
        location: locationType,
        isKidFriendly,
        isPrivate,
        isCompetition,
        requiresApproval,
        waitlistIds: [],
        tags,
        rules,
      };

      // Only include optional fields if they have values
      if (locationDetails.trim()) {
        eventData.locationDetails = locationDetails.trim();
      }
      if (maxParticipants) {
        eventData.maxParticipants = parseInt(maxParticipants, 10);
      }

      await EventsAPI.createEvent(user.uid, eventData as any);

      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('Create event error:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[AppColors.primary.main, AppColors.primary.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Give your event a catchy title"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What's your event about?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        {/* Event Type */}
        <Text style={styles.label}>Event Type *</Text>
        <View style={styles.typeGrid}>
          {EVENT_TYPES.map(type => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeChip,
                eventType === type.value && { backgroundColor: type.color, borderColor: type.color },
              ]}
              onPress={() => setEventType(type.value)}
            >
              <MaterialCommunityIcons
                name={type.icon as any}
                size={16}
                color={eventType === type.value ? 'white' : type.color}
              />
              <Text style={[
                styles.typeChipText,
                eventType === type.value && { color: 'white' },
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date & Time */}
        <Text style={styles.label}>Start Date & Time *</Text>
        <Text style={styles.hint}>Quick presets:</Text>
        <View style={styles.presetRow}>
          <TouchableOpacity style={styles.presetButton} onPress={() => setQuickDate(1, 14, 0)}>
            <Text style={styles.presetText}>Tomorrow 2PM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setQuickDate(7, 14, 0)}>
            <Text style={styles.presetText}>Next Week 2PM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setQuickDate(2, 10, 0)}>
            <Text style={styles.presetText}>In 2 Days 10AM</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dateTimeRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
            maxLength={10}
          />
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="HH:MM"
            value={startTime}
            onChangeText={setStartTime}
            maxLength={5}
          />
        </View>

        <Text style={styles.label}>End Date & Time *</Text>
        <View style={styles.dateTimeRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="YYYY-MM-DD"
            value={endDate}
            onChangeText={setEndDate}
            maxLength={10}
          />
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="HH:MM"
            value={endTime}
            onChangeText={setEndTime}
            maxLength={5}
          />
        </View>

        {/* Location */}
        <Text style={styles.label}>Location Type *</Text>
        <View style={styles.locationRow}>
          {LOCATION_TYPES.map(loc => (
            <TouchableOpacity
              key={loc.value}
              style={[
                styles.locationChip,
                locationType === loc.value && styles.locationChipActive,
              ]}
              onPress={() => setLocationType(loc.value)}
            >
              <MaterialCommunityIcons
                name={loc.icon as any}
                size={16}
                color={locationType === loc.value ? 'white' : '#374151'}
              />
              <Text style={[
                styles.locationChipText,
                locationType === loc.value && { color: 'white' },
              ]}>
                {loc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder={locationType === 'online' ? 'Meeting link or platform' : 'Address or venue name'}
          value={locationDetails}
          onChangeText={setLocationDetails}
        />

        {/* Max Participants */}
        <Text style={styles.label}>Max Participants (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Leave empty for unlimited"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="number-pad"
        />

        {/* Toggles */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons name="baby-face-outline" size={20} color="#374151" />
              <Text style={styles.toggleLabel}>Kid Friendly</Text>
            </View>
            <Switch value={isKidFriendly} onValueChange={setIsKidFriendly} trackColor={{ true: AppColors.primary.main }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons name="lock" size={20} color="#374151" />
              <Text style={styles.toggleLabel}>Private Event</Text>
            </View>
            <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: AppColors.primary.main }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons name="trophy" size={20} color="#374151" />
              <Text style={styles.toggleLabel}>Competition</Text>
            </View>
            <Switch value={isCompetition} onValueChange={setIsCompetition} trackColor={{ true: AppColors.primary.main }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#374151" />
              <Text style={styles.toggleLabel}>Requires Approval</Text>
            </View>
            <Switch value={requiresApproval} onValueChange={setRequiresApproval} trackColor={{ true: AppColors.primary.main }} />
          </View>
        </View>

        {/* Tags */}
        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. fun, beginner, weekend"
          value={tagsInput}
          onChangeText={setTagsInput}
        />

        {/* Rules */}
        <Text style={styles.label}>Rules / Guidelines (one per line)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Be respectful&#10;No spam"
          value={rulesInput}
          onChangeText={setRulesInput}
          multiline
          numberOfLines={3}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Create Event</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary.main,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  locationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  locationChipActive: {
    backgroundColor: AppColors.primary.main,
    borderColor: AppColors.primary.main,
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  toggleSection: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#374151',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
