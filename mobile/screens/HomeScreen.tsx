import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskItem } from '../components/TaskItem';
import { AddTaskInput } from '../components/AddTaskInput';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { BottomTabNavigator } from '../navigation/BottomTabNavigator';
import { TasksContext } from '../context/TasksContext';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '../types/index';

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
      const res = await fetch(`${ENDPOINTS.tasks}?view=${filter}`, {
        headers: getAuthHeaders(token || ''),
      });
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [filter, fetchTasks]);

  const handleAddTask = async (title: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.tasks, {
        method: 'POST',
        headers: getAuthHeaders(token || ''),
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks([json.data, ...tasks]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(ENDPOINTS.tasks, {
        method: 'PUT',
        headers: getAuthHeaders(token || ''),
        body: JSON.stringify({ id, status: newStatus }),
      });

      setTasks(tasks.map(t =>
        t.id === id ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${ENDPOINTS.tasks}?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token || ''),
      });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks().then(() => setRefreshing(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TaskPlanner</Text>
      </View>

      <AddTaskInput onAddTask={handleAddTask} />

      <View style={styles.filterContainer}>
        {['today', 'next7', 'all'].map((f) => (
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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
            onPress={() => {
              setSelectedTask(item);
              setModalVisible(true);
            }}
          />
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

      <TaskDetailModal
        task={selectedTask}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onUpdate={(updatedTask) => {
          setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        }}
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