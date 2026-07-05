import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '../types';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'today' | 'next7' | 'all'>('today');

  const fetchTasks = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/tasks?view=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } catch (error) {
      console.error('Fetch tasks error:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [filter, fetchTasks]);

  const handleAddTask = async (title: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks([json.data, ...tasks]);
      }
    } catch (error) {
      console.error('Add task error:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleToggleTask = async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      await fetch(`${API_BASE_URL}/api/v1/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      setTasks(tasks.map(t =>
        t.id === id ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      console.error('Toggle task error:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/tasks?id=${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Delete task error:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchTasks().then(() => setRefreshing(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TaskPlanner</Text>
      </View>

      <TextInput
        style={styles.addInput}
        placeholder="Add a new task..."
        placeholderTextColor="#6c757d"
        onSubmitEditing={e => handleAddTask(e.nativeEvent.text)}
      />

      <View style={styles.filterContainer}>
        {(['today', 'next7', 'all'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'today' ? 'Today' : f === 'next7' ? 'Next 7 Days' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity
              style={styles.taskRow}
              onPress={() => {
                setSelectedTask(item);
                setModalVisible(true);
              }}
            >
              <TouchableOpacity
                style={[styles.checkbox, item.status === 'completed' && styles.checkboxChecked]}
                onPress={() => handleToggleTask(item.id)}
              >
                {item.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.taskTitle, item.status === 'completed' && styles.taskTitleCompleted]}>
                {item.title}
              </Text>
              <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
                <Text style={styles.deleteButton}>×</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap above to add your first task
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addInput: {
    height: 48,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    color: '#6c757d',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  taskItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  deleteButton: {
    fontSize: 24,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
});