import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Modal,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import authService from "../services/authService";
import "nativewind";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error: any) {
        Alert.alert("Session Expired", "Please login again to continue");
        router.replace("/screens/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to logout. Please try again.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />
      <ScrollView className="flex-1">
        {/* Header Section */}
        <View className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 pt-12 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-black">
                Welcome back,
              </Text>
              <Text className="text-xl text-black/90">
                {user?.username || "Admin"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setLogoutModalVisible(true)}
              className="bg-white px-4 py-2 rounded-full shadow-sm"
            >
              <Text className="text-blue-600 font-semibold">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 -mt-8">
          {/* Stats Section */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] bg-white rounded-2xl shadow-sm p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Text className="text-blue-600 text-xl">👨‍🎓</Text>
                </View>
                <Text className="text-gray-500 text-sm">Total Students</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-2">0</Text>
              <Text className="text-green-500 text-xs mt-1">
                +0% from last month
              </Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl shadow-sm p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="bg-purple-100 p-2 rounded-lg">
                  <Text className="text-purple-600 text-xl">👨‍🏫</Text>
                </View>
                <Text className="text-gray-500 text-sm">Total Instructors</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-2">0</Text>
              <Text className="text-green-500 text-xs mt-1">
                +0% from last month
              </Text>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-800 mb-6">
              Quick Actions
            </Text>

            <View className="space-y-6">
              <TouchableOpacity
                onPress={() => router.push("/screens/registerStudent")}
                className="bg-white rounded-2xl shadow-sm p-4 mb-4" // <-- Added margin-bottom
              >
                <View className="flex-row items-center">
                  <View className="bg-blue-100 p-3 rounded-xl mr-4">
                    <Text className="text-blue-600 text-xl">👨‍🎓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">
                      Register Student
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      Add a new student to the system
                    </Text>
                  </View>
                  <View className="bg-gray-100 p-2 rounded-full">
                    <Text className="text-gray-500">+</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/screens/registerInstructor")}
                className="bg-white rounded-2xl shadow-sm p-4"
              >
                <View className="flex-row items-center">
                  <View className="bg-purple-100 p-3 rounded-xl mr-4">
                    <Text className="text-purple-600 text-xl">👨‍🏫</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">
                      Register Instructor
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      Add a new instructor to the system
                    </Text>
                  </View>
                  <View className="bg-gray-100 p-2 rounded-full">
                    <Text className="text-gray-500">+</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity Section */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Recent Activity
            </Text>
            <View className="bg-white rounded-2xl shadow-sm p-4">
              <Text className="text-gray-500 text-center py-4">
                No recent activity to show
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="w-80 p-8 bg-white rounded-2xl shadow-2xl">
            <View className="items-center">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl text-blue-500">?</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Confirm Logout
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                Are you sure you want to logout?
              </Text>
              <View className="flex-row space-x-4 w-full">
                <Pressable
                  className="flex-1 bg-gray-200 py-3 rounded-xl"
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text className="text-gray-600 text-center font-semibold">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-blue-500 py-2 rounded-xl"
                  onPress={() => {
                    setLogoutModalVisible(false);
                    handleLogout();
                  }}
                >
                  <Text className="text-white text-center font-semibold">
                    Logout
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Dashboard;
