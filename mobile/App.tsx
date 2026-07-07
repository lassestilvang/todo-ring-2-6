import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TasksProvider } from './context/TasksContext';
import HomeScreen from './screens/HomeScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import HabitTrackerScreen from './screens/HabitTrackerScreen';
import GoalTrackerScreen from './screens/GoalTrackerScreen';
import TimeTrackingScreen from './screens/TimeTrackingScreen';
import TimeBlockingScreen from './screens/TimeBlockingScreen';
import AIAssistantScreen from './screens/AIAssistantScreen';
import TemplateMarketplaceScreen from './screens/TemplateMarketplaceScreen';
import FocusSessionsScreen from './screens/FocusSessionsScreen';
import TeamsScreen from './screens/TeamsScreen';
import AutomationRulesScreen from './screens/AutomationRulesScreen';
import SavedViewsScreen from './screens/SavedViewsScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <TasksProvider>
          <SafeAreaProvider>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerStyle: { backgroundColor: '#3b82f6' },
                  headerTintColor: '#fff',
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
                  name="HabitTracker"
                  component={HabitTrackerScreen}
                  options={{ title: 'Habit Tracker' }}
                />
                <Stack.Screen
                  name="GoalTracker"
                  component={GoalTrackerScreen}
                  options={{ title: 'Goal Tracker' }}
                />
                <Stack.Screen
                  name="TimeTracking"
                  component={TimeTrackingScreen}
                  options={{ title: 'Time Tracking' }}
                />
                <Stack.Screen
                  name="TimeBlocking"
                  component={TimeBlockingScreen}
                  options={{ title: 'Time Blocking' }}
                />
                <Stack.Screen
                  name="AIAssistant"
                  component={AIAssistantScreen}
                  options={{ title: 'AI Assistant' }}
                />
                <Stack.Screen
                  name="TemplateMarketplace"
                  component={TemplateMarketplaceScreen}
                  options={{ title: 'Templates' }}
                />
                <Stack.Screen
                  name="FocusSessions"
                  component={FocusSessionsScreen}
                  options={{ title: 'Focus Sessions' }}
                />
                <Stack.Screen
                  name="Teams"
                  component={TeamsScreen}
                  options={{ title: 'Teams' }}
                />
                <Stack.Screen
                  name="AutomationRules"
                  component={AutomationRulesScreen}
                  options={{ title: 'Automation Rules' }}
                />
                <Stack.Screen
                  name="SavedViews"
                  component={SavedViewsScreen}
                  options={{ title: 'Saved Views' }}
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