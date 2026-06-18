import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as QueryClientProvider } from 'react-query';
import { TasksProvider } from './context/TasksContext';
import HomeScreen from './screens/HomeScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <QueryClientProvider>
      <PaperProvider>
        <TasksProvider>
          <SafeAreaProvider>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  header: {
                    headerStyle: { backgroundColor: '#3b82f6' },
                    headerTintColor: '#fff',
                  },
                }}
              >
                <Stack.Screen
                  name="Auth"
                  component={AuthScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ title: 'Tasks' }}
                />
                <Stack.Screen
                  name="TaskDetail"
                  component={TaskDetailScreen}
                  options={{ title: 'Task Details' }}
                />
                <Stack.Screen
                  name="Analytics"
                  component={AnalyticsScreen}
                  options={{ title: 'Analytics' }}
                />
                <Stack.Screen
                  name="Profile"
                  component={ProfileScreen}
                  options={{ title: 'Profile' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </TasksProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}