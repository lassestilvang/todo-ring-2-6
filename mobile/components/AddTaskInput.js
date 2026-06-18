import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Plus } from 'lucide-react-native';

export function AddTaskInput({ onAddTask }) {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddTask(title.trim());
    setTitle('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="What needs to be done?"
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
  },
});