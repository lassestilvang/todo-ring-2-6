import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { ENDPOINTS, getAuthHeaders } from '../config/api';

export default function TimeBlockingScreen({ route, navigation }) {
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [taskId, setTaskId] = useState('');

  useEffect(() => {
    fetchTimeBlocks();
  }, [currentDate]);

  const fetchTimeBlocks = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const dateStr = currentDate.toISOString().split('T')[0];
      const res = await fetch(`${ENDPOINTS.timeBlocking}?date=${dateStr}`, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setTimeBlocks(json.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch time blocks');
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    // Get token from storage
    const token = 'dummy-token';
    return token;
  };

  const saveTimeBlock = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      const token = await getToken();
      const body = {
        title,
        start_time: `${currentDate.toISOString().split('T')[0]}T${startTime}:00`,
        end_time: `${currentDate.toISOString().split('T')[0]}T${endTime}:00`,
        task_id: taskId || undefined,
      };

      let res;
      if (editingBlock) {
        res = await fetch(`${ENDPOINTS.timeBlocking}/${editingBlock.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(token),
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(ENDPOINTS.timeBlocking, {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (json.success) {
        setModalVisible(false);
        resetForm();
        fetchTimeBlocks();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save time block');
    }
  };

  const deleteTimeBlock = async (id) => {
    Alert.alert(
      'Delete Time Block',
      'Are you sure you want to delete this time block?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              await fetch(`${ENDPOINTS.timeBlocking}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(token),
              });
              fetchTimeBlocks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete time block');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setTaskId('');
    setEditingBlock(null);
  };

  const prevDay = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
  };

  const nextDay = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTimeBlock = ({ item }) => (
    <View style={styles.timeBlock}>
      <View style={styles.timeBlockHeader}>
        <View>
          <Text style={styles.timeBlockTitle}>{item.title}</Text>
          <Text style={styles.timeBlockTime}>
            {item.start_time?.split('T')[1]?.split(':').slice(0, 2).join(':')} -
            {item.end_time?.split('T')[1]?.split(':').slice(0, 2).join(':')}
          </Text>
        </View>
        <View style={styles.timeBlockActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setEditingBlock(item);
              setTitle(item.title);
              setStartTime(item.start_time?.split('T')[1]?.split(':').slice(0, 2).join(':'));
              setEndTime(item.end_time?.split('T')[1]?.split(':').slice(0, 2).join(':'));
              setModalVisible(true);
            }}
          >
            <Edit size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteTimeBlock(item.id)}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      {item.task && (
        <Text style={styles.taskLink}>Task: {item.task.title}</Text>
      )}
    </View>
  );

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
        <TouchableOpacity onPress={prevDay}>
          <ChevronLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.dateTitle}>{formatDate(currentDate)}</Text>
        <TouchableOpacity onPress={nextDay}>
          <ChevronRight size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add Time Block</Text>
        </TouchableOpacity>

        {timeBlocks.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#e5e7eb" />
            <Text style={styles.emptyStateText}>No time blocks scheduled</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the button above to add your first time block
            </Text>
          </View>
        ) : (
          <View style={styles.timeBlocksList}>
            {timeBlocks.map((block) => (
              <View key={block.id} style={{ marginBottom: 12 }}>
                {renderTimeBlock({ item: block })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingBlock ? 'Edit Time Block' : 'Add Time Block'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.timeInputRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Start Time"
                value={startTime}
                onChangeText={setStartTime}
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="End Time"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Task ID (optional)"
              value={taskId}
              onChangeText={setTaskId}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveTimeBlock}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timeBlocksList: {
    gap: 12,
  },
  timeBlock: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  timeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeBlockTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  timeBlockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  taskLink: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});