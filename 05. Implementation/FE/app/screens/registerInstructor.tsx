import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import authService from '../services/authService';
import { error as logError } from '../utils/logger'; // Custom logger
import 'nativewind';

type FormData = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  instructorId: string;
  department: string;
};

const RegisterInstructor = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    instructorId: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const requiredFields: (keyof FormData)[] = ['username', 'email', 'password', 'firstName', 'lastName', 'instructorId', 'department'];
    const emptyFields = requiredFields.filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.register(
        formData.username,
        formData.email,
        formData.password,
        '3' // Role 3 = Instructor
      );

      if (response.success) {
        setRegistrationSuccess(true);
        if (response.warning) {
          Alert.alert('Success with Warning', response.warning);
        } else {
          Alert.alert(
            'Success',
            'Instructor registration successful! An OTP has been sent to their email for account activation.'
          );
        }
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Registration failed');
      }
    } catch (err: any) {
      logError('Registration Error:', err); // Custom logger
      Alert.alert(
        'Error',
        err?.message || 'Failed to register instructor'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        <View className="bg-white rounded-lg shadow-lg p-8">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-blue-600 mb-2">
              Register Instructor
            </Text>
            <Text className="text-gray-600 text-center">
              Create a new instructor account
            </Text>
          </View>

          <View className="space-y-6">
            {/* Username */}
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

            {/* Email */}
            <View>
              <Text className="text-gray-700 mb-2 font-medium">Gmail</Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                placeholder="Enter Gmail address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View>
              <Text className="text-gray-700 mb-2 font-medium">Password</Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                placeholder="Enter password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
              />
            </View>

            {/* First Name */}
            <View>
              <Text className="text-gray-700 mb-2 font-medium">First Name</Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                placeholder="Enter first name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
              />
            </View>

            {/* Last Name */}
            <View>
              <Text className="text-gray-700 mb-2 font-medium">Last Name</Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
              />
            </View>

            {/* Instructor ID */}
            <View>
              <Text className="text-gray-700 mb-2 font-medium">Instructor ID</Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                placeholder="Enter instructor ID"
                value={formData.instructorId}
                onChangeText={(value) => handleInputChange('instructorId', value)}
              />
            </View>

            {/* Department */}
            <View>
              <Text className="text-gray-700 mb-2 font-medium">Faculty</Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                placeholder="Enter department"
                value={formData.department}
                onChangeText={(value) => handleInputChange('department', value)}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className="bg-blue-500 py-4 px-8 rounded-xl mt-8 shadow-lg"
              onPress={handleRegister}
              disabled={loading}
            >
              <Text className="text-white text-lg font-semibold text-center">
                {loading ? 'Registering...' : 'Register Instructor'}
              </Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              className="mt-6"
              onPress={() => router.back()}
            >
              <Text className="text-blue-500 text-center">Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterInstructor;
