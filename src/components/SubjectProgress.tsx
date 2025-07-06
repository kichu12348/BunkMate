import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubjectAttendance } from '../types/api';
import { useThemedStyles } from '../hooks/useTheme';
import { formatPercentage, getStatusColor } from '../utils/helpers';
import { ThemeColors } from '../types/theme';

interface SubjectProgressProps {
  subject: SubjectAttendance;
  showDetails?: boolean;
}

export const SubjectProgress: React.FC<SubjectProgressProps> = ({ 
  subject, 
  showDetails = false 
}) => {
  const styles = useThemedStyles(createStyles);
  const statusColor = getStatusColor(subject.status);

  const getProgressWidth = () => {
    return Math.min(Math.max(subject.percentage, 0), 100);
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {subject.subject.name}
          </Text>
          {showDetails && (
            <Text style={styles.subjectCode}>{subject.subject.code}</Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon()} 
            size={16} 
            color={statusColor} 
            style={styles.statusIcon}
          />
          <Text style={[styles.percentage, { color: statusColor }]}>
            {formatPercentage(subject.percentage)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${getProgressWidth()}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
          
          {/* Show 75% threshold line */}
          <View style={[styles.thresholdLine, { left: '75%' }]} />
        </View>
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Attended</Text>
            <Text style={styles.detailValue}>{subject.attended_classes}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>{subject.total_classes}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: statusColor }]}>
              {subject.status.toUpperCase()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
});
