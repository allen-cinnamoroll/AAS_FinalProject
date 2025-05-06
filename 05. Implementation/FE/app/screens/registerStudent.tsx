import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import authService from '../services/authService';
import { log, error as logError } from '../utils/logger';
import 'nativewind';

type FormData = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId: string;
  program: string;
};

const RegisterStudent = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    studentId: '',
    program: '',
  });
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const requiredFields: (keyof FormData)[] = ['username', 'email', 'password', 'firstName', 'lastName', 'studentId', 'program'];
    const emptyFields = requiredFields.filter(field => !formData[field]);
    
    if (emptyFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      log('Attempting to register student:', { username: formData.username, email: formData.email });
      
      const response = await authService.register(
        formData.username,
        formData.email,
        formData.password,
        '2' // Role 2 for student
      );
      
      if (response.success) {
        log('Student registration successful:', { username: formData.username, email: formData.email });
        setRegistrationSuccess(true);
        if (response.warning) {
          Alert.alert(
            'Success with Warning',
            response.warning,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Success',
            'Student registered successfully. An OTP has been sent to your email for account activation.',
            [{ text: 'OK' }]
          );
        }
        router.replace('/screens/dashboard');
      } else {
        logError('Student registration failed:', response.message);
        Alert.alert('Registration Failed', response.message || 'Registration failed');
      }
    } catch (error: any) {
      logError('Student registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-white">
        <View className="flex-1 w-full h-screen">
          <View className="w-full h-full flex items-center justify-center relative">
            <Image
              source={require('../../assets/images/bg.png')}
              className="absolute w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute w-full h-full bg-gradient-to-r from-blue-600/90 to-blue-400/90" />
            <View className="w-full max-w-md px-8 py-12 bg-white/95 rounded-3xl shadow-2xl z-10 mx-4">
              <View className="items-center mb-8">
                <Text className="text-4xl font-bold text-blue-600 mb-2">
                  Register Student
                </Text>
                <Text className="text-gray-600 text-center">
                  Create a new student account
                </Text>
              </View>
              
              <View className="space-y-6">
                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Username</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter username"
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Email</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                  />
                </View>
                
                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Password</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter password"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-medium">First Name</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Last Name</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Student ID</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter student ID"
                    value={formData.studentId}
                    onChangeText={(value) => handleInputChange('studentId', value)}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Program</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter program"
                    value={formData.program}
                    onChangeText={(value) => handleInputChange('program', value)}
                  />
                </View>

                <TouchableOpacity 
                  className="bg-blue-600 py-4 px-8 rounded-xl mt-6 shadow-lg"
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    {loading ? 'Registering...' : 'Register'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterStudent; 