import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Play, Pause, StopCircle, BarChart3 } from 'lucide-react-native';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TimeTrackingScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);
  const [summary, setSummary] = useState({ totalHours: 0, totalMinutes: 0 });

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.timeTrackingSummary, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setEntries(json.data.recentEntries || []);
        setSummary(json.data.totalTime || { hours: 0, minutes: 0 });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch time entries');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const renderEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryTask}>{item.task?.title || 'Unnamed Task'}</Text>
        <Text style={styles.entryDuration}>{formatTime(item.duration)}</Text>
      </View>
      <Text style={styles.entryDescription}>{item.description}</Text>
      <Text style={styles.entryTime}>
        {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Tracking</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Clock size={24} color="#3b82f6" />
          <Text style={styles.summaryValue}>
            {summary.hours}h {summary.minutes}m
          </Text>
        </View>
        <Text style={styles.summaryLabel}>Total Time Tracked</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Entries</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={48} color="#e9ecef" />
          <Text style={styles.emptyText}>No time entries yet</Text>
          <Text style={styles.emptySubtext}>
            Start tracking time for your tasks
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTask: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  entryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  entryTime: {
    fontSize: 12,
    color: '#9ca3af',
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
});
