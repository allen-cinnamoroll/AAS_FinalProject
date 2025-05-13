import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "../services/api";
import OTPVerification from "./OTPVerification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Dashboard from "./Dashboard";

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onAuthSuccess?: (userData: any) => void;
}

export default function AuthModal({ isVisible, onClose, initialMode, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // OTP and dashboard state
  const [isOtpModalVisible, setOtpModalVisible] = useState(false);
  const [isDashboardVisible, setDashboardVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const switchMode = () => {
    resetForm();
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Reset error and success messages
    setErrorMessage("");
    setSuccessMessage("");
    
    // Form validation
    if (!username.trim()) {
      setErrorMessage("Username is required");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid Gmail address (example@gmail.com)");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        username: username.trim(),
        gmail: email.trim(),
        password,
      });

      if (response.data.success) {
        setSuccessMessage("Register Successful! Login to verify your account.");
        setTimeout(() => {
          resetForm();
          setMode('login');
        }, 2000);
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message || "Registration failed");
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Email and password are required");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      console.log("Attempting login with:", { email, password });
      const response = await authService.login({
        gmail: email,
        password
      });

      console.log("Login response:", JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        // If user is already verified, the backend will return a token
        if (response.data.token) {
          // Save user data and token to AsyncStorage
          const user = response.data.data;
          console.log("User data from login:", JSON.stringify(user, null, 2));
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          await AsyncStorage.setItem('token', response.data.token);
          
          setUserData(user);
          
          // Notify parent component about successful login
          if (onAuthSuccess) {
            onAuthSuccess(user);
          }
          
          // Close the auth modal
          onClose();
        } else {
          // Need OTP verification
          setSuccessMessage("OTP sent successfully. Please verify your account.");
          setTimeout(() => {
            setOtpModalVisible(true);
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response && error.response.data) {
        console.error("Error response data:", error.response.data);
        setErrorMessage(error.response.data.message || "Login failed");
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSuccess = async (data: any) => {
    try {
      console.log("OTP success data:", JSON.stringify(data, null, 2));
      // Save user data and token to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(data.data));
      await AsyncStorage.setItem('token', data.token);
      
      setOtpModalVisible(false);
      setUserData(data.data);
      
      // Notify parent component about successful login
      if (onAuthSuccess) {
        onAuthSuccess(data.data);
      }
      
      // Close the auth modal
      onClose();
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  };

  // Reset when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      resetForm();
    }
  }, [isVisible]);

  return (
    <>
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-md rounded-xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">
                {mode === 'login' ? 'Sign In' : 'Register'}
              </Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {successMessage ? (
              <View className="bg-green-100 p-3 rounded-lg mb-4">
                <Text className="text-green-800 text-center">{successMessage}</Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View className="bg-red-100 p-3 rounded-lg mb-4">
                <Text className="text-red-800 text-center">{errorMessage}</Text>
              </View>
            ) : null}

            <View className="space-y-4">
              {mode === 'register' && (
                <View>
                  <Text className="text-gray-700 mb-1">Username</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>
              )}

              <View>
                <Text className="text-gray-700 mb-1">Gmail</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter your Gmail address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 mb-1">Password</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter your password (min. 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <Pressable
                onPress={mode === 'login' ? handleLogin : handleRegister}
                disabled={isLoading}
                className={`py-3 rounded-lg mb-4 flex-row justify-center items-center ${
                  isLoading ? "bg-blue-400" : "bg-blue-700"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold">
                    {mode === 'login' ? 'Sign In' : 'Register'}
                  </Text>
                )}
              </Pressable>

              <View className="flex-row justify-center">
                <Text className="text-gray-600">
                  {mode === 'login'
                    ? "Don't have an account? "
                    : "Already have an account? "}
                </Text>
                <Pressable onPress={switchMode}>
                  <Text className="text-blue-700 font-semibold">
                    {mode === 'login' ? 'Register' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP Verification Modal */}
      <OTPVerification
        isVisible={isOtpModalVisible}
        email={email}
        onClose={() => setOtpModalVisible(false)}
        onSuccess={handleOtpSuccess}
      />
    </>
  );
}

export const generateOTP = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
}; 