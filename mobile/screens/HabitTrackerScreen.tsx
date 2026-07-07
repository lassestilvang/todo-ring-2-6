import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Plus, Minus, Calendar } from 'lucide-react-native';
import { ENDPOINTS, getAuthHeaders } from '../config/api';

export default function HabitTrackerScreen({ route, navigation }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await fetch(ENDPOINTS.habits);
      const json = await res.json();
      if (json.success) {
        setHabits(json.data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (taskId, isCompleted) => {
    // In a real app, this would call the API to update habit streak
    // For now, we'll just optimistically update the UI
    setHabits(habits.map(h =>
      h.taskId === taskId
        ? { ...h, isCompleted: !isCompleted }
        : h
    ));
  };

  const renderHabitCard = (habit) => {
    const streak = habit.currentStreak || 0;
    const isCompleted = habit.isCompleted || false;

    return (
      <View key={habit.id} style={styles.habitCard}>
        <View style={styles.habitHeader}>
          <Text style={styles.habitTitle}>{habit.title}</Text>
          <TouchableOpacity
            style={[styles.streakBadge, streak > 0 && styles.activeStreak]}
            onPress={() => toggleHabit(habit.taskId, isCompleted)}
          >
            <Flame size={16} color={streak > 0 ? '#f59e0b' : '#9ca3af'} />
            <Text style={[styles.streakText, streak > 0 && styles.activeStreakText]}>
              {streak}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.habitFooter}>
          <Text style={styles.habitDate}>
            Last: {habit.lastCompleted || 'Never'}
          </Text>
          <Text style={styles.bestStreak}>
            Best: {habit.longestStreak || 0} days
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habit Tracker</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Flame size={48} color="#e5e7eb" />
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptyDescription}>
            Create a habit to start tracking your streak
          </Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Add Your First Habit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {habits.map(renderHabitCard)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  habitCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeStreak: {
    backgroundColor: '#fef3c7',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeStreakText: {
    color: '#92400e',
  },
  habitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  bestStreak: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});