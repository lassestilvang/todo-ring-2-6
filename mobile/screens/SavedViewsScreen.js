import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SavedViewsScreen({ navigation }) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newView, setNewView] = useState({ name: '', icon: '🔍', filters: '{}' });

  useEffect(() => {
    fetchViews();
  }, []);

  const fetchViews = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.savedViews, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setViews(json.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch saved views');
    } finally {
      setLoading(false);
    }
  };

  const saveView = async () => {
    if (!newView.name.trim()) {
      Alert.alert('Error', 'View name is required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.savedViews, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(newView),
      });

      const json = await res.json();
      if (json.success) {
        setModalVisible(false);
        setNewView({ name: '', icon: '🔍', filters: '{}' });
        fetchViews();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save view');
    }
  };

  const useView = (view) => {
    // Navigate to Home with the view's filters
    navigation.navigate('Home', { filters: view.filters });
  };

  const deleteView = async (id) => {
    Alert.alert(
      'Delete View',
      'Are you sure you want to delete this saved view?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${ENDPOINTS.savedViews}?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(token),
              });
              setViews(views.filter(v => v.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete view');
            }
          },
        },
      ]
    );
  };

  const renderView = ({ item }) => (
    <TouchableOpacity style={styles.viewCard} onPress={() => useView(item)}>
      <View style={styles.viewHeader}>
        <Text style={styles.viewIcon}>{item.icon}</Text>
        <View style={styles.viewInfo}>
          <Text style={styles.viewName}>{item.name}</Text>
          <Text style={styles.viewFilters} numberOfLines={1}>
            {item.filters}
          </Text>
        </View>
        <TouchableOpacity onPress={() => deleteView(item.id)}>
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Views</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : views.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Saved Views</Text>
          <Text style={styles.emptySubtext}>
            Save custom filter views for quick access
          </Text>
        </View>
      ) : (
        <FlatList
          data={views}
          keyExtractor={(item) => item.id}
          renderItem={renderView}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create View Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save View</Text>
            <TextInput
              style={styles.input}
              placeholder="View Name"
              value={newView.name}
              onChangeText={(text) => setNewView({ ...newView, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Icon (emoji)"
              value={newView.icon}
              onChangeText={(text) => setNewView({ ...newView, icon: text })}
            />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Filters (JSON)"
              value={newView.filters}
              onChangeText={(text) => setNewView({ ...newView, filters: text })}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveView}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
  viewCard: {
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
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  viewInfo: {
    flex: 1,
  },
  viewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewFilters: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
});