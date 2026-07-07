import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/components/theme';
import { getAllTasks, getTaskById } from '@/lib/repositories/task-repository';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateSmartPriority, suggestRelatedTasks } from '@/lib/ai/task-predictor';
import { TaskStatus } from '@/types';
import AIFeedbackComponent from '@/components/AIFeedbackComponent';

const AIAssistantScreen = () => {
  const { colors } = useTheme();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [userId, setUserId] = useState('current_user'); // In real app, get from auth context

  // Load tasks when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const userID = await AsyncStorage.getItem('userId');
        const allTasks = await getAllTasks(userID || 'current_user');
        setTasks(allTasks);
        setUserId(userID || 'current_user');
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };
    loadTasks();
  }, []);

  // Handle suggestions when user sends a message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get AI response
      const response = await getSmartResponse(input);

      // Add bot response to messages
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      Alert.alert('Error', response.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  // Get AI response with smart suggestions
  const getSmartResponse = async (query) => {
    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();

    // Smart suggestions based on query context
    let responseText = '';
    let suggestions = [];

    // Task prediction scenarios
    if (normalizedQuery.includes('complete') || normalizedQuery.includes('finish')) {
      suggestions = suggestRelatedTasks('complete');
    } else if (normalizedQuery.includes('remind') || normalizedQuery.includes('reminder')) {
      suggestions = suggestRelatedTasks('remind');
    } else if (normalizedQuery.includes('schedule') || normalizedQuery.includes('plan')) {
      suggestions = suggestRelatedTasks('schedule');
    } else if (normalizedQuery.includes('priority')) {
      suggestions = suggestRelatedTasks('priority');
    }

    // Generate smart prioritization response
    if (suggestions.length > 0) {
      responseText = `I found some tasks that match your query:\n`;
      suggestions.forEach(task => {
        const priorityScore = calculateSmartPriority(tasks.find(t => t.id === task.id));
        const priorityLabels = { high: 'H', medium: 'M', low: 'L' };
        responseText += `• ${task.title} [${priorityLabels[tasks.find(t => t.id === task.id)?.priority || 'N'}P ${priorityScore.toFixed(1)}]\n`;
      });
      responseText += '\nWould you like to mark any as high priority?';
    } else {
      // Default response when no direct matches
      responseText = "I'm analyzing your task history... Based on your recent activity, you might want to:\n";
      const urgentTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.deadline === new Date().toISOString().split('T')[0]);
      if (urgentTasks.length > 0) {
        urgentTasks.forEach(task => {
          responseText += `• Focus on "${task.title}" - it has high priority and is due soon\n`;
        });
      } else {
        responseText += "• Review your upcoming deadlines\n";
      }
    }

    return responseText;
  };

  // Render task suggestion chips
  const renderSuggestionChip = ({ item }) => {
    const task = tasks.find(t => t.id === item.id) || {};
    const priorityLabels = { high: 'H', medium: 'M', low: 'L' };

    return (
      <TouchableOpacity style={styles.suggestionChip} key={item.id}>
        <View style={styles.chipBackground}>
          <Text style={styles.priorityBadge}>
            {priorityLabels[task.priority] || 'N'}
          </Text>
          <Text style={styles.chipText}>{task.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render message bubbles
  const renderMessage = ({ item }) => {
    const isBot = item.type === 'bot';
    return (
      <View style={[styles.message, isBot ? styles.botMessage : styles.userMessage]}>
        <View style={styles.messageHeader}>
          {isBot ? <Text style={styles.botLabel}>AI Assistant</Text> : <Text style={styles.userLabel}>You</Text>}
        </View>
        <Text style={styles.messageContent}>{item.content}</Text>
        {isBot && item.id && (
          <AIFeedbackComponent
            interactionId={item.id}
            userId={userId}
          />
        )}
      </View>
    );
  };

  // Smart prioritization helper
  const scoreTask = (task) => {
    const score = calculateSmartPriority(task);
    return {
      task,
      priorityScore: score.priorityScore,
      urgency: score.urgency,
      recommendation: score.recommendation
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>✨ AI Assistant</Text>
        <Text style={styles.subtitle}>Smart task management assistant</Text>
      </View>

      {/* Message History */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messages}
        style={styles.messageList}
      />

      {/* Smart Suggestions Section */}
      {tasks.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionHeader}>💡 Smart Suggestions</Text>
          <FlatList
            data={tasks.map(t => ({
              ...t,
              priorityScore: calculateSmartPriority(t).priorityScore.toFixed(1),
              deadlineDate: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : null,
              isUrgent: new Date(t.deadline || '').getTime() <= new Date().getTime() + 86400000
            })).slice(0, 5), // Limit to top 5 suggestions
            keyExtractor={(item) => item.id},
            renderItem={renderSuggestionChip}
          />
        </View>
      )}

      {/* Input Controls */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, loading && styles.inputDisabled]}
          placeholder="Ask about tasks..."
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={100}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.sendText}>
            {loading ? (
              <ActivityIndicator size={16} color="white" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AIAssistantScreen;

// Extend theme with AI-specific styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  messages: {
    flex: 1,
    padding: 16,
  },
  messageList: {
    paddingBottom: 100,
  },
  message: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  userLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
    color: colors.text,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.card,
    backgroundColor: colors.card,
    elevation: 3,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    paddingRight: 16,
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: '#e5e7eb',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: 'white',
    fontWeight: '600',
  },
  suggestionsContainer: {
    padding: 16,
    backgroundColor: '#f1f5f9',
  },
  suggestionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: colors.primary,
  },
  suggestionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  chipBackground: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  priorityBadge: {
    marginRight: 6,
    padding: 2,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 14,
    color: '#111827',
  },
});