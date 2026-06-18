import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, TrendingUp, Clock, CheckCircle2 } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState('week');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.rangeSelector}>
            {(['day', 'week', 'month'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.rangeButton,
                  timeRange === range && styles.rangeButtonActive,
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text
                  style={[
                    styles.rangeText,
                    timeRange === range && styles.rangeTextActive,
                  ]}
                >
                  {range === 'day' ? 'Day' : range === 'week' ? 'Week' : 'Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.cards}>
            <View style={styles.card}>
              <BarChart3 size={24} color="#3b82f6" />
              <Text style={styles.cardValue}>85%</Text>
              <Text style={styles.cardLabel}>Completion Rate</Text>
            </View>
            <View style={styles.card}>
              <CheckCircle2 size={24} color="#10b981" />
              <Text style={styles.cardValue}>42</Text>
              <Text style={styles.cardLabel}>Completed</Text>
            </View>
            <View style={styles.card}>
              <Clock size={24} color="#f59e0b" />
              <Text style={styles.cardValue}>12h</Text>
              <Text style={styles.cardLabel}>Time Tracked</Text>
            </View>
            <View style={styles.card}>
              <TrendingUp size={24} color="#8b5cf6" />
              <Text style={styles.cardValue}>7</Text>
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