import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Checkbox } from 'expo-checkbox';
import {
  Calendar,
  Tag,
  Clock,
  Subtitles,
  Link,
  Bell,
  Share,
  MoreVertical,
  Trash2,
  Edit,
  Plus,
  AlertCircle,
} from 'lucide-react-native';
import { ENDPOINTS, getAuthHeaders } from '../config/api';

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
    fetchSubtasks();
    fetchDependencies();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${ENDPOINTS.tasks}?id=${taskId}`);
      const json = await res.json();
      if (json.success) setTask(json.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async () => {
    try {
      const res = await fetch(`${ENDPOINTS.subtasks}?taskId=${taskId}`);
      const json = await res.json();
      if (json.success) setSubtasks(json.data);
    } catch (error) {
      console.error('Failed to fetch subtasks');
    }
  };

  const fetchDependencies = async () => {
    try {
      const res = await fetch(`${ENDPOINTS.dependencies}?taskId=${taskId}&view=blocking`);
      const json = await res.json();
      if (json.success) setDependencies(json.data);
    } catch (error) {
      console.error('Failed to fetch dependencies');
    }
  };

  const toggleSubtask = async (id, isCompleted) => {
    try {
      const res = await fetch(`${ENDPOINTS.subtasks}?id=${id}`, {
        method: 'PUT',
      });
      if (res.ok) {
        setSubtasks(subtasks.map(s =>
          s.id === id ? { ...s, isCompleted: !isCompleted } : s
        ));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle subtask');
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const res = await fetch(ENDPOINTS.subtasks, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, title: newSubtask }),
      });
      const json = await res.json();
      if (json.success) {
        setSubtasks([...subtasks, json.data]);
        setNewSubtask('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add subtask');
    }
  };

  const deleteTask = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${ENDPOINTS.tasks}?id=${taskId}`, {
                method: 'DELETE',
              });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  if (loading && !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Task not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TextInput
            style={styles.title}
            value={task.title}
            onChangeText={(text) => setTask({ ...task, title: text })}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={deleteTask}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.action}>
              <Edit size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.action}>
              <Share size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.action}>
              <MoreVertical size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <TextInput
              style={styles.description}
              value={task.description || ''}
              onChangeText={(text) => setTask({ ...task, description: text })}
              placeholder="Add description..."
              multiline
            />
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <Calendar size={18} color="#6b7280" />
              <Text style={styles.label}>{task.date || 'Set date'}</Text>
            </View>
            {task.deadline && (
              <View style={styles.row}>
                <Bell size={18} color="#6b7280" />
                <Text style={styles.label}>Due: {task.deadline}</Text>
              </View>
            )}
          </View>

          {/* Dependencies Section */}
          {dependencies.length > 0 && (
            <View style={styles.section}>
              <View style={styles.row}>
                <Link size={18} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Blocked By</Text>
              </View>
              {dependencies.map((dep, index) => (
                <View key={index} style={styles.depItem}>
                  <AlertCircle size={16} color="#f59e0b" />
                  <Text style={styles.depText}>{dep.title}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recurring Task Info */}
          {task.recurringType && task.recurringType !== 'none' && (
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.sectionTitle}>Recurring</Text>
                <Badge style={{ backgroundColor: '#3b82f6' }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {task.recurringType}
                  </Text>
                </Badge>
              </View>
              <Text style={styles.label}>
                Next occurrence will be automatically created
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subtasks ({subtasks.length})</Text>
            <View style={styles.subtaskInput}>
              <TextInput
                style={styles.subtaskTextInput}
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="Add subtask..."
              />
              <TouchableOpacity style={styles.addButton} onPress={addSubtask}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {subtasks.map((sub) => (
              <View key={sub.id} style={styles.subtaskItem}>
                <Checkbox
                  value={sub.isCompleted}
                  onValueChange={() => toggleSubtask(sub.id, sub.isCompleted)}
                />
                <Text
                  style={[
                    styles.subtaskText,
                    sub.isCompleted && styles.subtaskCompleted,
                  ]}
                >
                  {sub.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtaskInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  subtaskTextInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  subtaskCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  depItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 6,
    marginTop: 4,
  },
  depText: {
    fontSize: 14,
    color: '#92400e',
  },
});