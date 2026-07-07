import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AutomationPieChart } from 'react-native-svg-charts';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AutomationRulesScreen() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    triggerType: 'task_completed',
    actionType: 'create_task',
    actionValue: '',
  });

  const triggerTypes = [
    { value: 'task_completed', label: 'Task Completed' },
    { value: 'task_created', label: 'Task Created' },
    { value: 'task_updated', label: 'Task Updated' },
    { value: 'due_date_passed', label: 'Due Date Passed' },
  ];

  const actionTypes = [
    { value: 'create_task', label: 'Create Task' },
    { value: 'update_task', label: 'Update Task' },
    { value: 'set_priority', label: 'Set Priority' },
    { value: 'send_notification', label: 'Send Notification' },
  ];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.automation, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setRules(json.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch automation rules');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id, isEnabled) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${ENDPOINTS.automation}?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });
      setRules(rules.map(r =>
        r.id === id ? { ...r, isEnabled: !isEnabled } : r
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle rule');
    }
  };

  const createRule = async () => {
    if (!newRule.name.trim()) {
      Alert.alert('Error', 'Rule name is required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.automation, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(newRule),
      });

      const json = await res.json();
      if (json.success) {
        setModalVisible(false);
        setNewRule({ name: '', triggerType: 'task_completed', actionType: 'create_task', actionValue: '' });
        fetchRules();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create rule');
    }
  };

  const deleteRule = async (id) => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${ENDPOINTS.automation}?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(token),
              });
              setRules(rules.filter(r => r.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete rule');
            }
          },
        },
      ]
    );
  };

  const renderRule = ({ item }) => (
    <View style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <Text style={styles.ruleName}>{item.name}</Text>
        <Switch
          value={item.isEnabled}
          onValueChange={(value) => toggleRule(item.id, item.isEnabled)}
        />
      </View>
      <Text style={styles.ruleDescription}>
        When {getTriggerLabel(item.triggerType)} → {getActionLabel(item.actionType)}
      </Text>
      <View style={styles.ruleFooter}>
        <TouchableOpacity onPress={() => deleteRule(item.id)}>
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getTriggerLabel = (type) => {
    const labels = {
      task_completed: 'a task is completed',
      task_created: 'a task is created',
      task_updated: 'a task is updated',
      due_date_passed: 'a due date passes',
    };
    return labels[type] || type;
  };

  const getActionLabel = (type) => {
    const labels = {
      create_task: 'create a new task',
      update_task: 'update a task',
      set_priority: 'set priority',
      send_notification: 'send notification',
    };
    return labels[type] || type;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Automation Rules</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : rules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Automation Rules</Text>
          <Text style={styles.emptySubtext}>
            Create rules to automate your workflow
          </Text>
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(item) => item.id}
          renderItem={renderRule}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create Rule Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Automation Rule</Text>
            <TextInput
              style={styles.input}
              placeholder="Rule Name"
              value={newRule.name}
              onChangeText={(text) => setNewRule({ ...newRule, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Action Value"
              value={newRule.actionValue}
              onChangeText={(text) => setNewRule({ ...newRule, actionValue: text })}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={createRule}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  ruleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  ruleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  ruleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    color: '#ef4444',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
});