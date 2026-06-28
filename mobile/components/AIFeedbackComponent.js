import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react-native';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AIFeedbackComponent = ({ interactionId, userId }) => {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Please select a rating');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(ENDPOINTS.aiFeedback, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          interactionId,
          userId,
          rating,
          feedbackText: feedbackText || null,
          wasHelpful: rating >= 4
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setRating(0);
          setFeedbackText('');
          setSubmitted(false);
        }, 2000);
      } else {
        Alert.alert('Error', 'Failed to submit feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not submit feedback');
    }
  };

  if (submitted) {
    return (
      <View style={styles.thankYouContainer}>
        <Text style={styles.thankYouText}>Thank you for your feedback!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Was this helpful?</Text>

      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.star,
              star <= rating && styles.starSelected
            ]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.feedbackInput}
        placeholder="Add optional feedback..."
        value={feedbackText}
        onChangeText={setFeedbackText}
        multiline
        maxLength={200}
      />

      <TouchableOpacity
        style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={rating === 0}
      >
        <Send size={18} color="white" />
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AIFeedbackComponent;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 28,
    color: '#e5e7eb',
  },
  starSelected: {
    color: '#fbbf24',
  },
  feedbackInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    maxHeight: 80,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitText: {
    color: 'white',
    fontWeight: '600',
  },
  thankYouContainer: {
    padding: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
  },
  thankYouText: {
    color: 'white',
    fontWeight: '500',
  },
});