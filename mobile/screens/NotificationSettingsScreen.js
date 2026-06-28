import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationSettingsScreen() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [dailyDigest, setDailyDigest] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setEmailReminders(parsed.emailReminders ?? true);
        setPushNotifications(parsed.pushNotifications ?? true);
        setReminderTime(parsed.reminderTime ?? '09:00');
        setDailyDigest(parsed.dailyDigest ?? false);
        setWeeklySummary(parsed.weeklySummary ?? true);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setVibrationEnabled(parsed.vibrationEnabled ?? true);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        emailReminders,
        pushNotifications,
        reminderTime,
        dailyDigest,
        weeklySummary,
        soundEnabled,
        vibrationEnabled,
      };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleToggle = (setting, value) => {
    switch (setting) {
      case 'emailReminders':
        setEmailReminders(value);
        break;
      case 'pushNotifications':
        setPushNotifications(value);
        break;
      case 'dailyDigest':
        setDailyDigest(value);
        break;
      case 'weeklySummary':
        setWeeklySummary(value);
        break;
      case 'soundEnabled':
        setSoundEnabled(value);
        break;
      case 'vibrationEnabled':
        setVibrationEnabled(value);
        break;
    }
    saveSettings();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="Notification Preferences" />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Email Reminders</Text>
            <Switch
              value={emailReminders}
              onValueChange={(value) => handleToggle('emailReminders', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={pushNotifications}
              onValueChange={(value) => handleToggle('pushNotifications', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily Digest</Text>
            <Switch
              value={dailyDigest}
              onValueChange={(value) => handleToggle('dailyDigest', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Weekly Summary</Text>
            <Switch
              value={weeklySummary}
              onValueChange={(value) => handleToggle('weeklySummary', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound</Text>
            <Switch
              value={soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={(value) => handleToggle('vibrationEnabled', value)}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
});