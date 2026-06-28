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
import { Users, Plus, Settings, LogOut } from 'lucide-react-native';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(`${ENDPOINTS.teams}?userId=${userId}`, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setTeams(json.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Team name is required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.teams, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalVisible(false);
        setNewTeamName('');
        setNewTeamDescription('');
        fetchTeams();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create team');
    }
  };

  const leaveTeam = async (teamId) => {
    Alert.alert(
      'Leave Team',
      'Are you sure you want to leave this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${ENDPOINTS.teams}/${teamId}/members`, {
                method: 'DELETE',
                headers: getAuthHeaders(token),
              });
              fetchTeams();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave team');
            }
          },
        },
      ]
    );
  };

  const renderTeam = ({ item }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <View style={styles.teamIcon}>
          <Users size={24} color="#3b82f6" />
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.teamMeta}>
            {item.memberCount || 1} member{item.memberCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.teamAction}
          onPress={() => leaveTeam(item.id)}
        >
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teams</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : teams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color="#e9ecef" />
          <Text style={styles.emptyTitle}>No Teams Yet</Text>
          <Text style={styles.emptySubtext}>
            Create a team to start collaborating with others
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.createButtonText}>Create Your First Team</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={renderTeam}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create Team Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Team</Text>
            <TextInput
              style={styles.input}
              placeholder="Team Name"
              value={newTeamName}
              onChangeText={setNewTeamName}
            />
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Description (optional)"
              value={newTeamDescription}
              onChangeText={setNewTeamDescription}
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
                style={styles.createTeamButton}
                onPress={createTeam}
              >
                <Text style={styles.createTeamButtonText}>Create</Text>
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
  listContent: {
    paddingHorizontal: 20,
  },
  teamCard: {
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
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  teamDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  teamMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  teamAction: {
    padding: 8,
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  createTeamButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  createTeamButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
});