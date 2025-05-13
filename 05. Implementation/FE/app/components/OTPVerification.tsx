import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authService } from '../services/api';

interface OTPVerificationProps {
  isVisible: boolean;
  email: string;
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

export default function OTPVerification({
  isVisible,
  email,
  onClose,
  onSuccess,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Effect for OTP resend timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const showToast = (message: string) => {
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Message', message);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    // Update the current OTP digit
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus to next input or dismiss keyboard if last input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (text && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    // Handle backspace key
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtpCode = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      showToast("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      // Make actual API call to verify OTP
      const response = await authService.verifyOtp({
        gmail: email,
        otp: otpValue
      });
      
      console.log("OTP verification response:", response.data);
      
      if (response.data.success) {
        showToast("Email verification successful");
        onSuccess(response.data);
      } else {
        showToast(response.data.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      showToast(error.response?.data?.message || "An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) return;
    
    setResendLoading(true);
    
    try {
      // For now we'll just simulate resending
      // In a real implementation, you would call the backend to resend the OTP
      setTimeout(() => {
        setResendLoading(false);
        setTimeLeft(60); // Start 60 seconds countdown
        showToast("A new OTP has been sent to your email");
      }, 1500);
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      showToast("Failed to resend OTP");
      setResendLoading(false);
    }
  };

  const resetForm = () => {
    setOtp(["", "", "", "", "", ""]);
    setTimeLeft(0);
  };

  useEffect(() => {
    // Reset form when modal is opened
    if (isVisible) {
      resetForm();
    }
  }, [isVisible]);

  return (
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
              Verify Your Email
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <Text className="text-gray-600 mb-6 text-center">
            Enter the 6-digit code sent to{" "}
            <Text className="font-semibold">{email}</Text>
          </Text>

          <View className="flex-row justify-between mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className="w-10 h-12 border border-gray-300 rounded-lg text-center text-lg font-bold"
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0 && isVisible}
              />
            ))}
          </View>

          <Pressable
            onPress={verifyOtpCode}
            disabled={isLoading}
            className={`py-3 rounded-lg mb-4 flex-row justify-center items-center ${
              isLoading ? "bg-blue-400" : "bg-blue-700"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold">Verify OTP</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleResendOTP}
            disabled={resendLoading || timeLeft > 0}
            className={`py-3 rounded-lg border border-blue-700 flex-row justify-center items-center ${
              resendLoading || timeLeft > 0 ? "opacity-50" : ""
            }`}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color="#1D4ED8" />
            ) : (
              <Text className="text-blue-700 font-semibold">
                {timeLeft > 0 ? `Resend OTP (${timeLeft}s)` : "Resend OTP"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
} 