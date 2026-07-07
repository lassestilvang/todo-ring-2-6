import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, TrendingUp, Clock, CheckCircle2, RefreshCw } from 'lucide-react-native';
import { ENDPOINTS } from '../config/api';

export default function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${ENDPOINTS.analytics}?range=30d`);
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
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
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity onPress={fetchAnalytics} style={styles.refreshButton}>
            <RefreshCw size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.cards}>
            <View style={styles.card}>
              <BarChart3 size={24} color="#3b82f6" />
              <Text style={styles.cardValue}>{analytics?.completionRate || 0}%</Text>
              <Text style={styles.cardLabel}>Completion Rate</Text>
            </View>
            <View style={styles.card}>
              <CheckCircle2 size={24} color="#10b981" />
              <Text style={styles.cardValue}>{analytics?.completed || 0}</Text>
              <Text style={styles.cardLabel}>Completed</Text>
            </View>
            <View style={styles.card}>
              <Clock size={24} color="#f59e0b" />
              <Text style={styles.cardValue}>
                {analytics?.totalTime?.hours || 0}h
              </Text>
              <Text style={styles.cardLabel}>Time Tracked</Text>
            </View>
            <View style={styles.card}>
              <TrendingUp size={24} color="#8b5cf6" />
              <Text style={styles.cardValue}>{analytics?.streak || 0}</Text>
              <Text style={styles.cardLabel}>Current Streak</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Task completed: "Design mockup"</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Task created: "Backend API"</Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
  },
  rangeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  rangeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  rangeTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  activityText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
});