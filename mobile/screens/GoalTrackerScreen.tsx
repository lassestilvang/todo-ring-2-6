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
import { Target, Plus, TrendingUp } from 'lucide-react-native';
import type { Goal } from '../types';

interface GoalTrackerScreenProps {
  route: { params?: { goalId?: string } };
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export default function GoalTrackerScreen({ route, navigation }: GoalTrackerScreenProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/goals`);
      const json = await res.json();
      if (json.success) {
        setGoals(json.data || []);
      }
    } catch (error) {
      console.error('Fetch goals error:', error);
      Alert.alert('Error', 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const renderGoalCard = (goal: Goal) => {
    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
    const isCompleted = goal.isCompleted || progress >= 100;

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: goal.color || '#3b82f6' }]}>
            <Text style={styles.categoryText}>{goal.category || 'General'}</Text>
          </View>
          <Text style={styles.goalTitle}>{goal.title}</Text>
        </View>

        {goal.description && (
          <Text style={styles.goalDescription} numberOfLines={2}>
            {goal.description}
          </Text>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {goal.currentValue} / {goal.targetValue} {goal.unit || 'tasks'}
            </Text>
            <Text style={styles.percentageText}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.deadlineText}>
            Due: {goal.endDate}
          </Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
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
        <Text style={styles.title}>My Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('GoalTracker')}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Target size={48} color="#e5e7eb" />
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyDescription}>
            Create a goal to start tracking your progress
          </Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {goals.map(renderGoalCard)}
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
  goalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    color: '#6b7280',
  },
  completedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
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