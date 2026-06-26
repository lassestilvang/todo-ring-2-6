import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TasksContext } from '../context/TasksContext';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const { login } = useContext(TasksContext);

  useEffect(() => {
    checkBiometricSupport();
    loadBiometricPreference();
  }, []);

  const checkBiometricSupport = async () => {
    if (Platform.OS === 'web') return;

    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);
  };

  const loadBiometricPreference = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      const userEmail = await AsyncStorage.getItem('userEmail');
      setIsBiometricEnabled(enabled === 'true');

      if (enabled === 'true' && userEmail) {
        setEmail(userEmail);
      }
    } catch (error) {
      console.error('Failed to load biometric preference:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricSupported) return;

    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Biometric Not Available', 'No biometric credentials enrolled.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access TaskPlanner',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const loginResult = await login(email, password);
        if (loginResult.success) {
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('biometricEnabled', 'true');
        }
      } else {
        Alert.alert('Authentication Failed', result.error || 'Please try again.');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Biometric authentication failed.');
    }
  };

  const handleSubmit = async () => {
    if (isLogin) {
      const result = await login(email, password);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Login failed');
      } else if (isBiometricSupported && password) {
        // Offer to enable biometric login
        Alert.alert(
          'Biometric Login',
          'Would you like to enable biometric login for faster access?',
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                await AsyncStorage.setItem('userEmail', email);
                await AsyncStorage.setItem('biometricEnabled', 'true');
              },
            },
          ]
        );
      }
    } else {
      // Register
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Account created! Please login.');
        setIsLogin(true);
      } else {
        Alert.alert('Error', json.error || 'Registration failed');
      }
    }
  };

  const handleBiometricPress = () => {
    if (isBiometricEnabled && email) {
      handleBiometricLogin();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TaskPlanner</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isLogin && isBiometricSupported && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricPress}
          >
            <Text style={styles.biometricText}>
              {isBiometricEnabled ? 'Use Face ID / Touch ID' : 'Enable Biometric Login'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {isLogin ? 'Login' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.switchLink}>
              {isLogin ? 'Sign Up' : 'Login'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#6b7280',
  },
  switchLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  biometricButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  biometricText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
});