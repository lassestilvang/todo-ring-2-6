import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function OfflineSyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Check for pending sync items
    const checkPending = async () => {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    };
    checkPending();
  }, [isOnline]);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {!isOnline ? (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>You are offline</Text>
        </View>
      ) : pendingCount > 0 ? (
        <View style={styles.syncContainer}>
          <Text style={styles.syncText}>
            {pendingCount} task{pendingCount !== 1 ? 's' : ''} pending sync
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

async function getPendingSyncCount() {
  // This would integrate with the offline cache
  return 0;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  offlineContainer: {
    backgroundColor: '#f59e0b',
    padding: 12,
    alignItems: 'center',
  },
  syncContainer: {
    backgroundColor: '#3b82f6',
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    color: 'white',
    fontWeight: '600',
  },
  syncText: {
    color: 'white',
    fontWeight: '600',
  },
});