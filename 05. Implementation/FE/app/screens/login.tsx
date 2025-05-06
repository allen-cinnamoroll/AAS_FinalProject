import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import authService from '../services/authService';
import { error as logError } from '../utils/logger'; // Custom logger
import 'nativewind';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      setErrorModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(email, password);

      if (response.success) {
        // Show success modal and redirect after delay
        setSuccessModalVisible(true);
        setTimeout(() => {
          setSuccessModalVisible(false);
          router.replace('/screens/dashboard');
        }, 1500);
      } else {
        setErrorMessage(response.message || 'Login failed');
        setErrorModalVisible(true);
      }
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      logError('Login error:', error); // 🔒 Will not print unless you enable it in logger.ts
      setErrorMessage(errorMessage);
      setErrorModalVisible(true);
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
                  Welcome 
                </Text>
                <Text className="text-gray-600 text-center">
                  Sign in to access your account
                </Text>
              </View>

              <View className="space-y-6">
                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Email</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-medium">Password</Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    placeholder="Enter your password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <TouchableOpacity
                  className="bg-blue-600 py-4 px-8 rounded-xl mt-6 shadow-lg"
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    {loading ? 'Signing in...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="w-80 p-8 bg-white rounded-2xl shadow-2xl">
            <View className="items-center">
              <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">✓</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Welcome Back!
              </Text>
              <Text className="text-gray-600 text-center">
                Redirecting to dashboard...
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="w-80 p-8 bg-white rounded-2xl shadow-2xl">
            <View className="items-center">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl text-red-500">!</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Login Failed
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                {errorMessage}
              </Text>
              <Pressable
                className="w-full bg-red-500 py-3 rounded-xl"
                onPress={() => setErrorModalVisible(false)}
              >
                <Text className="text-white text-center font-semibold">
                  Try Again
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default Login;
