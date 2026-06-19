import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Calendar, BarChart3, User } from 'lucide-react-native';

export function BottomTabNavigator({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          navigation.navigate(route.name, { merge: true });
        };

        const onLongPress = () => {
          navigation.jumpTo(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <View style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
              {route.name === 'Home' && <Home size={24} color={isFocused ? '#3b82f6' : '#6b7280'} />}
              {route.name === 'Calendar' && <Calendar size={24} color={isFocused ? '#3b82f6' : '#6b7280'} />}
              {route.name === 'Analytics' && <BarChart3 size={24} color={isFocused ? '#3b82f6' : '#6b7280'} />}
              {route.name === 'Profile' && <User size={24} color={isFocused ? '#3b82f6' : '#6b7280'} />}
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: '#3b82f620',
  },
  tabLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});