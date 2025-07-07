import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../types/theme';
import { userAttendanceService, AttendanceOverride } from '../db/userAttendanceService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConflictItemProps {
  conflict: AttendanceOverride;
  onResolve: (conflict: AttendanceOverride, resolution: 'accept_teacher' | 'keep_user') => void;
}

const ConflictItem: React.FC<ConflictItemProps> = ({ conflict, onResolve }) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const formatDate = () => {
    const date = new Date(conflict.year, conflict.month - 1, conflict.day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const showResolutionDialog = () => {
    Alert.alert(
      'Resolve Conflict',
      `Date: ${formatDate()}, Hour ${conflict.hour}\n\nTeacher marked: ${
        conflict.teacher_attendance === 'P' ? 'Present' : 'Absent'
      }\nYour record: ${
        conflict.user_attendance === 'P' ? 'Present' : 'Absent'
      }\n\nWhich record would you like to keep?`,
      [
        {
          text: 'Accept Teacher',
          onPress: () => onResolve(conflict, 'accept_teacher'),
        },
        {
          text: 'Keep My Record',
          onPress: () => onResolve(conflict, 'keep_user'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.conflictItem} onPress={showResolutionDialog}>
      <View style={styles.conflictHeader}>
        <View style={styles.conflictBadge}>
          <Ionicons name="warning" size={16} color={colors.surface} />
          <Text style={styles.conflictBadgeText}>Conflict</Text>
        </View>
        <Text style={styles.conflictDate}>{formatDate()}</Text>
      </View>

      <View style={styles.conflictContent}>
        <Text style={styles.conflictSubject}>Subject ID: {conflict.subject_id}</Text>
        <Text style={styles.conflictTime}>Hour {conflict.hour}</Text>
        
        <View style={styles.attendanceComparison}>
          <View style={styles.attendanceOption}>
            <Text style={styles.attendanceLabel}>Teacher:</Text>
            <View style={[
              styles.attendanceValue,
              { backgroundColor: conflict.teacher_attendance === 'P' ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Ionicons 
                name={conflict.teacher_attendance === 'P' ? 'checkmark' : 'close'} 
                size={14} 
                color={conflict.teacher_attendance === 'P' ? colors.success : colors.error} 
              />
              <Text style={[
                styles.attendanceText,
                { color: conflict.teacher_attendance === 'P' ? colors.success : colors.error }
              ]}>
                {conflict.teacher_attendance === 'P' ? 'Present' : 'Absent'}
              </Text>
            </View>
          </View>

          <View style={styles.attendanceOption}>
            <Text style={styles.attendanceLabel}>Your Record:</Text>
            <View style={[
              styles.attendanceValue,
              { backgroundColor: conflict.user_attendance === 'P' ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Ionicons 
                name={conflict.user_attendance === 'P' ? 'checkmark' : 'close'} 
                size={14} 
                color={conflict.user_attendance === 'P' ? colors.success : colors.error} 
              />
              <Text style={[
                styles.attendanceText,
                { color: conflict.user_attendance === 'P' ? colors.success : colors.error }
              ]}>
                {conflict.user_attendance === 'P' ? 'Present' : 'Absent'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.conflictActions}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        <Text style={styles.tapToResolveText}>Tap to resolve</Text>
      </View>
    </TouchableOpacity>
  );
};

export const ConflictsOverviewScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [conflicts, setConflicts] = useState<AttendanceOverride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      setIsLoading(true);
      const conflictData = userAttendanceService.getConflicts();
      setConflicts(conflictData);
    } catch (error) {
      console.error('Error loading conflicts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConflicts();
    setRefreshing(false);
  };

  const handleResolveConflict = async (
    conflict: AttendanceOverride,
    resolution: 'accept_teacher' | 'keep_user'
  ) => {
    try {
      await userAttendanceService.resolveConflict(
        conflict.subject_id,
        conflict.year,
        conflict.month,
        conflict.day,
        conflict.hour,
        resolution
      );
      
      // Remove resolved conflict from list
      setConflicts(prev => prev.filter(c => 
        !(c.subject_id === conflict.subject_id &&
          c.year === conflict.year &&
          c.month === conflict.month &&
          c.day === conflict.day &&
          c.hour === conflict.hour)
      ));

      Alert.alert(
        'Conflict Resolved',
        `Attendance record has been ${resolution === 'accept_teacher' ? 'updated to match teacher record' : 'kept as your record'}.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve conflict');
      console.error('Error resolving conflict:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      <Text style={styles.emptyTitle}>No Conflicts</Text>
      <Text style={styles.emptyMessage}>
        All your attendance records match with teacher records
      </Text>
    </View>
  );

  const renderConflictItem = ({ item }: { item: AttendanceOverride }) => (
    <ConflictItem conflict={item} onResolve={handleResolveConflict} />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Conflicts</Text>
        <Text style={styles.headerSubtitle}>
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} to resolve
        </Text>
      </View>

      {/* Instructions */}
      {conflicts.length > 0 && (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={styles.instructionText}>
              Conflicts occur when your attendance record differs from teacher's record
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="hand-left" size={16} color={colors.primary} />
            <Text style={styles.instructionText}>
              Tap on any conflict to choose which record to keep
            </Text>
          </View>
        </View>
      )}

      {/* Conflicts List */}
      <FlatList
        data={conflicts}
        renderItem={renderConflictItem}
        keyExtractor={(item) => 
          `${item.subject_id}-${item.year}-${item.month}-${item.day}-${item.hour}`
        }
        contentContainerStyle={[
          styles.listContainer,
          conflicts.length === 0 && styles.listContainerEmpty
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  listContainerEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  conflictItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  conflictBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  conflictDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  conflictContent: {
    marginBottom: 16,
  },
  conflictSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  conflictTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  attendanceComparison: {
    flexDirection: 'row',
    gap: 16,
  },
  attendanceOption: {
    flex: 1,
  },
  attendanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  attendanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  conflictActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  tapToResolveText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
