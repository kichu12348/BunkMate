import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubjectAttendance } from '../types/api';
import { useThemedStyles } from '../hooks/useTheme';
import { formatPercentage, getStatusColor, calculateClassesToAttend, calculateClassesCanMiss } from '../utils/helpers';
import { ThemeColors } from '../types/theme';

interface AttendanceCardProps {
  subject: SubjectAttendance;
  onPress?: (
    classesCanMiss: number,
    classesToAttend: number
  ) => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ subject, onPress }) => {
  const styles = useThemedStyles(createStyles);
  
  const statusColor = getStatusColor(subject.status);
  const classesToAttend = calculateClassesToAttend(subject.percentage, subject.total_classes);
  const classesCanMiss = calculateClassesCanMiss(subject.percentage, subject.total_classes);

  const getStatusIcon = () => {
    switch (subject.status) {
      case 'safe':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusMessage = () => {
    switch (subject.status) {
      case 'safe':
        return classesCanMiss > 0 ? `Can miss ${classesCanMiss} more classes` : 'Perfect attendance!';
      case 'warning':
        return classesToAttend > 0 ? `Attend ${classesToAttend} more classes to be safe` : 'Close to minimum requirement';
      case 'danger':
        return classesToAttend > 0 ? `Must attend ${classesToAttend} classes to reach 75%` : 'Below minimum requirement!';
      default:
        return 'Status unknown';
    }
  };

  const handlePress = () => {
    onPress?.(classesCanMiss, classesToAttend);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {subject.subject.name}
          </Text>
          <Text style={styles.subjectCode}>{subject.subject.code}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Ionicons name={getStatusIcon()} size={16} color="white" />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={[styles.statValue, { color: statusColor }]}>
            {formatPercentage(subject.percentage)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Classes</Text>
          <Text style={styles.statValue}>
            {subject.attended_classes}/{subject.total_classes}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(subject.percentage, 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {formatPercentage(subject.percentage)}
        </Text>
      </View>

      <Text style={[styles.statusMessage, { color: statusColor }]} numberOfLines={2}>
        {getStatusMessage()}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  statusMessage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
