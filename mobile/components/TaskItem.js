import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { Circle, CheckCircle2, Trash2, AlertCircle } from 'lucide-react-native';

export function TaskItem({ task, onToggle, onDelete, onPress }) {
  const isCompleted = task.status === 'completed';

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.containerCompleted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Checkbox
            value={isCompleted}
            onValueChange={() => onToggle(task.id)}
            color={isCompleted ? '#10b981' : '#9ca3af'}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                isCompleted && styles.titleCompleted,
              ]}
            >
              {task.title}
            </Text>
            {task.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {task.description}
              </Text>
            ) : null}
            {task.date && (
              <Text style={styles.date}>{new Date(task.date).toLocaleDateString()}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      {task.priority && task.priority !== 'none' && (
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  containerCompleted: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
});