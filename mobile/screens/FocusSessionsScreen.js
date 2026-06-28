import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Play, Pause, SkipForward, Award } from 'lucide-react-native';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FocusSessionsScreen({ route, navigation }) {
  const { taskId } = route.params || {};
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(25); // Default 25 minutes
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  useEffect(() => {
    if (isRunning && currentSession) {
      intervalRef.current = setInterval(() => {
        setCurrentSession(prev => {
          if (prev.remaining <= 1) {
            setIsRunning(false);
            completeSession(prev.id);
            return null;
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const fetchTask = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${ENDPOINTS.tasks}?id=${taskId}`, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setTask(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch task');
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${ENDPOINTS.focusSessions}?limit=20`, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setSessions(json.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch focus sessions');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.focusSessions, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          taskId,
          duration,
          userId: await AsyncStorage.getItem('userId'),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCurrentSession({
          id: json.data.id,
          remaining: duration * 60,
          taskId: json.data.taskId,
        });
        setIsRunning(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start focus session');
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsRunning(true);
  };

  const skipSession = () => {
    setIsRunning(false);
    setCurrentSession(null);
  };

  const completeSession = async (sessionId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${ENDPOINTS.focusSessions}?id=${sessionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ status: 'completed' }),
      });
      fetchSessions();
    } catch (error) {
      console.error('Failed to complete session');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalMinutes = sessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.duration, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Sessions</Text>
        <Text style={styles.subtitle}>Pomodoro Timer</Text>
      </View>

      <View style={styles.timerContainer}>
        {currentSession ? (
          <>
            <Text style={styles.timer}>{formatTime(currentSession.remaining)}</Text>
            <View style={styles.timerControls}>
              {!isRunning ? (
                <TouchableOpacity style={styles.button} onPress={resumeSession}>
                  <Pause size={32} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.button} onPress={pauseSession}>
                  <Play size={32} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.button} onPress={skipSession}>
                <SkipForward size={32} color="white" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.durationSelector}>Select Duration</Text>
            <View style={styles.durationOptions}>
              {[15, 25, 30, 45].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationButton,
                    duration === d && styles.durationButtonActive,
                  ]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={styles.durationText}>{d}m</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startSession}>
              <Text style={styles.startButtonText}>Start Focus Session</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Award size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{totalMinutes}m</Text>
          <Text style={styles.statLabel}>Total Focused</Text>
        </View>
        <View style={styles.stat}>
          <Clock size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      <ScrollView style={styles.sessionsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>
              Start a focus session to begin tracking
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>
                  {session.task?.title || 'Focus Session'}
                </Text>
                <Text style={styles.sessionTime}>
                  {session.duration} min • {session.status === 'completed' ? 'Completed' : 'Cancelled'}
                </Text>
              </View>
              <Text style={styles.sessionDate}>
                {new Date(session.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
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
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  timerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  durationSelector: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  durationButtonActive: {
    backgroundColor: '#3b82f6',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  durationTextActive: {
    color: 'white',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sessionsList: {
    paddingHorizontal: 20,
  },
  sessionItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sessionTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sessionDate: {
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
});