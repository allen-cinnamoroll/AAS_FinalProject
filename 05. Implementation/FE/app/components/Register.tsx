import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/api';

export default function Register({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [formData, setFormData] = useState({
    username: '',
    gmail: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Simple validation
    if (!formData.username || !formData.gmail || !formData.password || !formData.confirmPassword) {
      setMessage('Please fill all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (!formData.gmail.endsWith('@gmail.com')) {
      setMessage('Please enter a valid Gmail address');
      return;
    }

    try {
      setLoading(true);
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);
      
      if (response.data.success) {
        setMessage('');
        setRegistered(true);
        
        // Display success message
        if (Platform.OS === 'web') {
          alert('Admin registered successfully!');
        } else {
          Alert.alert('Success', 'Admin registered successfully!');
        }
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800`}>
            Register as Admin
          </Text>
          <Pressable 
            className="p-2"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#4B5563" />
          </Pressable>
        </View>
        
        {!registered ? (
          <>
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Username</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter your username"
                value={formData.username}
                onChangeText={(text) => handleChange('username', text)}
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Gmail</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="your.email@gmail.com"
                value={formData.gmail}
                onChangeText={(text) => handleChange('gmail', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Password</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-gray-700 mb-1">Confirm Password</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                secureTextEntry
              />
            </View>
            
            {message ? (
              <Text className="text-red-500 mb-4">{message}</Text>
            ) : null}
            
            <Pressable
              className="bg-blue-700 rounded-lg py-3 items-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Register</Text>
              )}
            </Pressable>
          </>
        ) : (
          <View className="items-center justify-center py-8">
            <Ionicons name="checkmark-circle-outline" size={64} color="#16A34A" />
            <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">Registered Successfully</Text>
            <Text className="text-gray-600 text-center mb-6">
              Your admin account has been created. You can now log in.
            </Text>
            <Pressable
              className="bg-blue-700 rounded-lg py-3 px-6"
              onPress={onClose}
            >
              <Text className="text-white font-semibold">Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
} 