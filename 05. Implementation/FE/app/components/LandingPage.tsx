import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthModal from "./AuthModal";
import Dashboard from "./Dashboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StudentDashboard from './StudentDashboard';
import InstructorDashboard from './InstructorDashboard';

// Define feature type
interface Feature {
  icon: any;
  title: string;
  description: string;
}

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768 || Platform.OS !== "web";
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isWelcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [shouldShowDashboard, setShouldShowDashboard] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Check if user is already logged in - run on initial load and when auth modal closes
  const checkLoginStatus = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('token');
      
      if (userDataString && token) {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        setIsLoggedIn(true);
        // Don't automatically show the dashboard on app launch
        // We only want to show the welcome modal on new logins
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  };
  
  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);
  
  // Effect to handle dashboard transition after login
  useEffect(() => {
    if (isLoggedIn && userData && !isWelcomeModalVisible) {
      setShouldShowDashboard(true);
    }
  }, [isLoggedIn, userData, isWelcomeModalVisible]);
  
  // Also check login status when auth modal closes (in case user logged in)
  const handleAuthModalClose = () => {
    setAuthModalVisible(false);
    checkLoginStatus();
  };
  
  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalVisible(true);
  };
  
  const handleLogout = async () => {
    setShowLogoutModal(true);
  };
  
  const confirmLogout = async () => {
    try {
      // Remove items from AsyncStorage
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('token');
      
      // Update local state after successful logout
      setIsLoggedIn(false);
      setUserData(null);
      setShouldShowDashboard(false);
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };
  
  // Add welcome modal handler for auth success
  const handleAuthSuccess = (user: any) => {
    console.log("LandingPage: handleAuthSuccess called with user:", JSON.stringify(user, null, 2));
    
    // Set user data first
    // Make sure we're storing the user data object, not the entire response
    const userData = user.data || user;
    setUserData(userData);
    
    // Show welcome modal
    setWelcomeModalVisible(true);
    console.log("LandingPage: Welcome modal visibility set to true");
    
    // Set login state after modal is shown
    setIsLoggedIn(true);
    
    // Close welcome modal after delay (increased to 3 seconds)
    setTimeout(() => {
      console.log("LandingPage: Closing welcome modal");
      setWelcomeModalVisible(false);
      // We don't need to set shouldShowDashboard here anymore
      // It will be handled by the useEffect that watches isWelcomeModalVisible
    }, 3000);
  };
  
  // Render logout confirmation modal
  const renderLogoutModal = () => {
    return (
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out-outline" size={32} color="#EF4444" />
            </View>
            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.logoutButtonContainer}>
              <Pressable 
                style={styles.cancelButton}
                onPress={cancelLogout}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={styles.logoutButton}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render appropriate dashboard based on user type
  if (shouldShowDashboard && userData) {
    console.log("LandingPage: Rendering dashboard with user data:", JSON.stringify(userData, null, 2));
    
    switch (userData.userType) {
      case 'student':
        return (
          <>
            <StudentDashboard userData={userData} onLogout={handleLogout} />
            {renderLogoutModal()}
          </>
        );
      case 'instructor':
        return (
          <>
            <InstructorDashboard userData={userData} onLogout={handleLogout} />
            {renderLogoutModal()}
          </>
        );
      case 'admin':
        return (
          <>
            <Dashboard userData={userData} onLogout={handleLogout} />
            {renderLogoutModal()}
          </>
        );
      default:
        console.error("Unknown user type:", userData.userType);
        return null;
    }
  }
  
  const features: Feature[] = [
    {
      icon: "location-outline",
      title: "Real-time Tracking",
      description:
        "Monitor assets, inventory, and personnel in real-time with precision tracking.",
    },
    {
      icon: "analytics-outline",
      title: "Advanced Analytics",
      description:
        "Gain insights through comprehensive analytics and customizable reports.",
    },
    {
      icon: "notifications-outline",
      title: "Smart Alerts",
      description:
        "Get instant notifications for critical events and threshold breaches.",
    },
    {
      icon: "phone-portrait-outline",
      title: "Mobile Access",
      description: "Access your tracking data from anywhere, on any device.",
    },
  ];

  return (
    <View style={styles.container}>
      {renderLogoutModal()}
      <ScrollView className="flex-1 bg-white">
        <StatusBar style="dark" />
        
        {/* Header/Navigation */}
        <View
          style={{ paddingTop: Platform.OS !== "web" ? insets.top || 12 : 12 }}
          className="flex-row justify-between items-center px-4 pb-4"
        >
          <View className="flex-row items-center">
            <Text className="text-xl font-bold text-blue-700">ATS</Text>
            {!isMobile && (
              <Text className="text-base text-gray-700 ml-2">
                | Automated Tracking System
              </Text>
            )}
          </View>
          <View className="flex-row items-center space-x-2">
            <Pressable 
              className="px-3 py-1.5 rounded-full border border-gray-200"
              onPress={() => openAuthModal('login')}
            >
              <Text className="text-gray-700 text-sm">
                Sign In
              </Text>
            </Pressable>
            <Pressable 
              className="px-3 py-1.5 rounded-full bg-blue-700"
              onPress={() => openAuthModal('register')}
            >
              <Text className="text-white text-sm">
                Get Started
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Hero Section */}
        <View className="px-4 py-8 flex justify-center items-center">
          <Text
            className={`${
              isMobile ? "text-2xl" : "text-4xl"
            } font-bold text-center text-gray-800 mb-3`}
          >
            Smart Tracking for Modern Enterprises
          </Text>
          <Text
            className={`${
              isMobile ? "text-base" : "text-xl"
            } text-center text-gray-600 mb-6 max-w-xl px-2`}
          >
            Automate your tracking processes and gain real-time insights with our
            comprehensive tracking system.
          </Text>
          <View className="flex-row space-x-3 mb-8">
            <Pressable 
              className="px-4 py-2 rounded-lg bg-blue-700"
              onPress={() => openAuthModal('register')}
            >
              <Text className="text-white font-semibold text-sm">
                Request Demo
              </Text>
            </Pressable>
            <Pressable 
              className="px-4 py-2 rounded-lg border border-blue-700"
              onPress={() => openAuthModal('register')}
            >
              <Text className="text-blue-700 font-semibold text-sm">
                Learn More
              </Text>
            </Pressable>
          </View>
          <View
            className={`w-full ${
              isMobile ? "h-48" : "h-64"
            } bg-gray-200 rounded-xl overflow-hidden mx-4`}
          >
            <View className="w-full h-full items-center justify-center">
              <Ionicons
                name={"analytics-outline" as any}
                size={isMobile ? 60 : 80}
                color="#4B5563"
              />
              <Text className="text-gray-500 mt-2 text-sm">
                Dashboard Preview
              </Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="px-4 py-8 bg-gray-50">
          <Text
            className={`${
              isMobile ? "text-2xl" : "text-3xl"
            } font-bold text-center text-gray-800 mb-8`}
          >
            Key Features
          </Text>
          <View
            className={`flex ${
              !isMobile ? "flex-row flex-wrap" : "flex-col"
            } justify-between`}
          >
            {features.map((feature, index) => (
              <View
                key={index}
                className={`${
                  !isMobile ? "w-[48%]" : "w-full"
                } bg-white p-4 rounded-lg shadow-sm mb-4`}
              >
                <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mb-3">
                  <Ionicons name={feature.icon} size={20} color="#1D4ED8" />
                </View>
                <Text className="text-lg font-semibold text-gray-800 mb-1">
                  {feature.title}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View className="px-4 py-10 bg-blue-700">
          <View className="items-center">
            <Text
              className={`${
                isMobile ? "text-xl" : "text-2xl"
              } font-bold text-center text-white mb-3`}
            >
              Ready to Streamline Your Tracking?
            </Text>
            <Text
              className={`${
                isMobile ? "text-base" : "text-lg"
              } text-center text-blue-100 mb-6 max-w-xl`}
            >
              Join thousands of companies that trust our Automated Tracking
              System.
            </Text>
            <Pressable 
              className="px-6 py-2.5 rounded-lg bg-white"
              onPress={() => openAuthModal('register')}
            >
              <Text className="text-blue-700 font-semibold text-sm">
                Get Started Today
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View className="px-4 py-6 bg-gray-800">
          <View
            className={`flex ${
              !isMobile
                ? "flex-row justify-center items-center space-x-6" // Align in a row for web
                : "flex-col items-center space-y-4" // Align in a column for mobile
            } mb-6`}
          >
            <View className="items-center">
              <Text className="text-xl font-bold text-white text-center">
                ATS
              </Text>
              <Text className="text-gray-400 mt-1 text-sm text-center">
                Automated Tracking System
              </Text>
            </View>
          </View>
          <View className="pt-4 border-t border-gray-700">
            <Text className="text-gray-400 text-center text-xs">
              © {new Date().getFullYear()} Automated Tracking System. All rights
              reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Authentication Modal */}
      <AuthModal 
        isVisible={isAuthModalVisible}
        onClose={handleAuthModalClose}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />
      
      {/* Standalone Welcome Modal */}
      <Modal
        visible={isWelcomeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          console.log("LandingPage: Welcome modal close requested");
          setWelcomeModalVisible(false);
        }}
      >
        <View className="flex-1 bg-black/70 justify-center items-center p-4">
          <View className="bg-white w-full max-w-md rounded-xl p-8 items-center">
            <View className="h-24 w-24 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Ionicons name="person" size={48} color="#1D4ED8" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-3">
              Welcome {userData?.fullName || userData?.name || userData?.username || (userData?.userType === 'admin' ? 'Admin' : userData?.userType === 'instructor' ? 'Instructor' : 'Student')}!
            </Text>
            <Text className="text-gray-600 text-center mb-6 text-lg">
              You have successfully logged in. Redirecting to dashboard...
            </Text>
            <ActivityIndicator size="large" color="#1D4ED8" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  logoutModalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});