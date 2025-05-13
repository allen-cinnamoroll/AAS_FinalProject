import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import OTPVerification from './OTPVerification';

export default function SignIn({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768 || Platform.OS !== 'web';
  
  const [formData, setFormData] = useState({
    gmail: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [isOtpModalVisible, setOtpModalVisible] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Simple validation
    if (!formData.gmail || !formData.password) {
      showToast('Please fill all required fields');
      return false;
    }

    // Validate Gmail format
    if (!formData.gmail.endsWith('@gmail.com')) {
      showToast('Please enter a valid Gmail address');
      return false;
    }

    return true;
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Message', message);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const response = await authService.login({
        gmail: formData.gmail,
        password: formData.password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        // If email is already verified and token is provided
        if (response.data.token) {
          // Store in AsyncStorage
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
          await AsyncStorage.setItem('token', response.data.token);
          
          showToast('Login successful');
          onClose();
        } else {
          // Need OTP verification
          setOtpModalVisible(true);
        }
      } else {
        showToast(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      showToast(error.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = async (data: any) => {
    try {
      // Store in AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(data.data));
      await AsyncStorage.setItem('token', data.token);
      
      setOtpModalVisible(false);
      showToast('Login successful');
      onClose();
    } catch (error) {
      console.error('Failed to save user data:', error);
      showToast('Error saving user data');
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <ScrollView className="flex-1 bg-white">
        <StatusBar style="dark" />
        
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800`}>
              Sign In
            </Text>
            <Pressable 
              className="p-2"
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color="#4B5563" />
            </Pressable>
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
          
          <View className="mb-6">
            <Text className="text-gray-700 mb-1">Password/ID</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Enter your password or ID"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry={!formData.password.match(/^\d{4}-\d{4}$/)} // Only show if it's a student ID format
            />
          </View>
          
          <Pressable
            className="bg-blue-700 rounded-lg py-3 items-center"
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-medium">Sign In</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      
      <OTPVerification
        isVisible={isOtpModalVisible}
        email={formData.gmail}
        onClose={() => setOtpModalVisible(false)}
        onSuccess={handleOtpSuccess}
      />
    </>
  );
}