import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../services/api';
import { StudentFormData } from '../../types/forms';
import { getImageUrl } from '../../utils/imageUtils';

interface StudentRegistrationFormProps {
  onSuccess?: () => void;
  editingStudent?: {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;
    yearLevel: string;
    program: string;
    faculty: string;
    studentId: string;
    gmail: string;
    idPhoto?: {
      url: string;
      publicId: string;
      metadata: {
        fileName: string;
        fileType: string;
        fileSize: number;
      };
    };
  } | null;
}

export default function StudentRegistrationForm({ onSuccess, editingStudent }: StudentRegistrationFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '',
    yearLevel: '1',
    program: '',
    faculty: '',
    studentId: '',
    gmail: '',
    idPhoto: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      console.log('Loading student data for editing:', editingStudent);
      setFormData({
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        middleName: editingStudent.middleName || '',
        suffix: editingStudent.suffix || '',
        yearLevel: editingStudent.yearLevel,
        program: editingStudent.program,
        faculty: editingStudent.faculty,
        studentId: editingStudent.studentId,
        gmail: editingStudent.gmail,
        idPhoto: editingStudent.idPhoto ? {
          uri: getImageUrl(editingStudent.idPhoto.url),
          type: editingStudent.idPhoto.metadata?.fileType || 'image/jpeg',
          name: editingStudent.idPhoto.metadata?.fileName || 'photo.jpg'
        } : null
      });
    }
  }, [editingStudent]);

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          alert('Sorry, we need camera roll permissions to upload photos!');
        } else {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos!');
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
        exif: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormData(prev => ({
          ...prev,
          idPhoto: {
            uri: asset.uri,
            type: 'image/jpeg',
            name: 'photo.jpg'
          }
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        alert('Failed to pick image. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.studentId || 
          !formData.program || !formData.faculty || !formData.gmail) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Only require photo for new registrations
      if (!editingStudent && !formData.idPhoto) {
        setError('ID photo is required for new registrations');
        setLoading(false);
        return;
      }

      // Validate student ID format
      if (!/^[0-9]{4}-[0-9]{4}$/.test(formData.studentId)) {
        setError('Student ID must follow the format: 0000-0000');
        setLoading(false);
        return;
      }

      // Validate Gmail format
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.gmail)) {
        setError('Please provide a valid Gmail address');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('studentId', formData.studentId);
      formDataToSend.append('program', formData.program);
      formDataToSend.append('faculty', formData.faculty);
      formDataToSend.append('gmail', formData.gmail);
      formDataToSend.append('yearLevel', formData.yearLevel);
      
      // Add optional fields if they exist
      if (formData.middleName) {
        formDataToSend.append('middleName', formData.middleName);
      }
      if (formData.suffix) {
        formDataToSend.append('suffix', formData.suffix);
      }

      // Add photo if it exists
      if (formData.idPhoto) {
        formDataToSend.append('idPhoto', {
          uri: formData.idPhoto.uri,
          type: 'image/jpeg',
          name: 'photo.jpg'
        } as any);
      }

      let response;
      if (editingStudent) {
        // Update existing student
        response = await apiClient.put(`/students/${editingStudent._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.success) {
          if (Platform.OS === 'web') {
            alert('Student updated successfully!');
          } else {
            Alert.alert('Success', 'Student updated successfully!');
          }
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setError(response.data.message || 'Failed to update student');
        }
      } else {
        // Create new student
        response = await apiClient.post('/students/register', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.success) {
          setRegistered(true);
          if (Platform.OS === 'web') {
            alert('Student registered successfully!');
          } else {
            Alert.alert('Success', 'Student registered successfully!');
          }
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setError(response.data.message || 'Failed to register student');
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <View className="bg-white p-6 rounded-lg shadow-sm items-center">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Registration Successful</Text>
          <Text className="text-gray-600 text-center mb-6">
            The student has been registered successfully.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setRegistered(false);
              if (onSuccess) {
                onSuccess();
              }
            }}
            className="bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="p-4 space-y-6">
        {/* Profile Photo Upload */}
        <View className="items-center">
          <View className="relative">
            <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
              {formData.idPhoto ? (
                <Image
                  source={{ uri: formData.idPhoto.uri }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-gray-500">No Photo</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={pickImage}
              className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full"
            >
              <Text className="text-white text-xs">Upload</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-600 mt-2 text-sm">Upload ID Photo</Text>
        </View>

        {/* Form Title */}
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            {editingStudent ? 'Edit Student' : 'Register New Student'}
          </Text>
          <Text className="text-gray-600 text-sm">
            Please fill in all required fields marked with *
          </Text>
        </View>

        {/* Personal Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Personal Information</Text>
          
          {/* First Name */}
          <View>
            <Text className="text-gray-700 mb-1">First Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.firstName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
              placeholder="Enter first name"
            />
          </View>

          {/* Last Name */}
          <View>
            <Text className="text-gray-700 mb-1">Last Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.lastName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
              placeholder="Enter last name"
            />
          </View>

          {/* Middle Name */}
          <View>
            <Text className="text-gray-700 mb-1">Middle Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.middleName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, middleName: text }))}
              placeholder="Enter middle name"
            />
          </View>

          {/* Suffix */}
          <View>
            <Text className="text-gray-700 mb-1">Suffix</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.suffix}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, suffix: value }))}
              >
                <Picker.Item label="None" value="" />
                <Picker.Item label="Jr." value="Jr." />
                <Picker.Item label="Sr." value="Sr." />
                <Picker.Item label="I" value="I" />
                <Picker.Item label="II" value="II" />
                <Picker.Item label="III" value="III" />
                <Picker.Item label="IV" value="IV" />
                <Picker.Item label="V" value="V" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Academic Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Academic Information</Text>

          {/* Year Level */}
          <View>
            <Text className="text-gray-700 mb-1">Year Level *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.yearLevel}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, yearLevel: value }))}
              >
                <Picker.Item label="1st Year" value="1" />
                <Picker.Item label="2nd Year" value="2" />
                <Picker.Item label="3rd Year" value="3" />
                <Picker.Item label="4th Year" value="4" />
                <Picker.Item label="5th Year" value="5" />
              </Picker>
            </View>
          </View>

          {/* Program */}
          <View>
            <Text className="text-gray-700 mb-1">Program *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.program}
              onChangeText={(text) => setFormData(prev => ({ ...prev, program: text }))}
              placeholder="Enter program"
            />
          </View>

          {/* Faculty */}
          <View>
            <Text className="text-gray-700 mb-1">Faculty *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.faculty}
              onChangeText={(text) => setFormData(prev => ({ ...prev, faculty: text }))}
              placeholder="Enter faculty"
            />
          </View>
        </View>

        {/* Contact Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Contact Information</Text>

          {/* Student ID */}
          <View>
            <Text className="text-gray-700 mb-1">Student ID *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.studentId}
              onChangeText={(text) => setFormData(prev => ({ ...prev, studentId: text }))}
              placeholder="Enter student ID"
            />
          </View>

          {/* Gmail */}
          <View>
            <Text className="text-gray-700 mb-1">Gmail *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.gmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, gmail: text }))}
              placeholder="Enter Gmail address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View className="bg-red-50 p-3 rounded-lg">
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`p-4 rounded-lg ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
        >
          <Text className="text-white text-center font-semibold">
            {loading ? 'Processing...' : editingStudent ? 'Update Student' : 'Register Student'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 