import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import 'nativewind';

export default function Index() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 w-full h-screen">
        <View className="w-full h-full flex items-center justify-center relative">
          <Image
            source={require('../assets/images/bg.png')}
            className="absolute w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute w-full h-full bg-gradient-to-r from-blue-500/80 to-blue-100/90" />
          <View className="px-10 text-center z-10">
            <Text className="text-5xl font-bold text-blue-500 mb-3 tracking-tight text-center">
              PROJECT X
            </Text>
            <Text className="text-4xl font-bold text-gray-800 leading-tight text-center mb-8">
              Automated Attendance{'\n'}Tracking System
            </Text>
            <Link href="/screens/login" asChild>
              <TouchableOpacity className="bg-blue-500 py-3 px-8 rounded-full shadow-lg">
                <Text className="text-white text-xl font-semibold text-center">
                  Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
