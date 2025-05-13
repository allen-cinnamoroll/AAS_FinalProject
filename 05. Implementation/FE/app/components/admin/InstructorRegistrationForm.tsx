import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../services/api';
import { InstructorFormData } from '../../types/forms';
import { getImageUrl } from '../../utils/imageUtils';
import OTPVerification from '../OTPVerification';

interface InstructorRegistrationFormProps {
  onSuccess?: () => void;
  editingInstructor?: {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;
    instructorId: string;
    program: string;
    faculty: string;
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

export default function InstructorRegistrationForm({ onSuccess, editingInstructor }: InstructorRegistrationFormProps) {
  const [formData, setFormData] = useState<InstructorFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '',
    instructorId: '',
    program: '',
    faculty: '',
    gmail: '',
    idPhoto: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    if (editingInstructor) {
      console.log('Loading instructor data for editing:', editingInstructor);
      const photoUrl = editingInstructor.idPhoto ? getImageUrl(editingInstructor.idPhoto.url) : '';
      console.log('Original photo URL:', editingInstructor.idPhoto?.url);
      console.log('Constructed photo URL:', photoUrl);
      
      setFormData({
        firstName: editingInstructor.firstName,
        lastName: editingInstructor.lastName,
        middleName: editingInstructor.middleName || '',
        suffix: editingInstructor.suffix || '',
        instructorId: editingInstructor.instructorId,
        program: editingInstructor.program,
        faculty: editingInstructor.faculty,
        gmail: editingInstructor.gmail,
        idPhoto: editingInstructor.idPhoto ? {
          uri: photoUrl,
          type: 'image',
          width: 800,
          height: 600
        } : null
      });
    }
  }, [editingInstructor]);

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload photos!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
        exif: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormData(prev => ({ 
          ...prev, 
          idPhoto: asset
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.instructorId || 
          !formData.program || !formData.faculty || !formData.gmail) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Only require photo for new registrations
      if (!editingInstructor && !formData.idPhoto) {
        setError('ID photo is required for new registrations');
        setLoading(false);
        return;
      }

      // Validate instructor ID format
      if (!/^[0-9]{6}-[A-Z]{2}-[0-9]{2}$/.test(formData.instructorId)) {
        setError('Instructor ID must follow the format: 000000-AA-00');
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
      formDataToSend.append('instructorId', formData.instructorId);
      formDataToSend.append('program', formData.program);
      formDataToSend.append('faculty', formData.faculty);
      formDataToSend.append('gmail', formData.gmail);
      
      // Add optional fields if they exist
      if (formData.middleName) {
        formDataToSend.append('middleName', formData.middleName);
      }
      if (formData.suffix) {
        formDataToSend.append('suffix', formData.suffix);
      }

      // Add photo if it exists
      if (formData.idPhoto) {
        const photoUri = formData.idPhoto.uri;
        const photoType = photoUri.endsWith('.jpg') || photoUri.endsWith('.jpeg') 
          ? 'image/jpeg' 
          : 'image/png';
        const photoName = photoUri.split('/').pop() || 'photo.jpg';
        
        formDataToSend.append('idPhoto', {
          uri: Platform.OS === 'android' ? photoUri : photoUri.replace('file://', ''),
          type: photoType,
          name: photoName
        } as any);
      }

      if (editingInstructor) {
        // Update existing instructor
        const response = await apiClient.put(`/instructors/${editingInstructor._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        });
        
        if (response.data.success) {
          alert('Instructor updated successfully!');
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setError(response.data.message || 'Failed to update instructor');
        }
      } else {
        // Create new instructor
        const response = await apiClient.post('/instructors/register', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        });
        
        if (response.data.success) {
          alert('Instructor registered successfully!');
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            middleName: '',
            suffix: '',
            instructorId: '',
            program: '',
            faculty: '',
            gmail: '',
            idPhoto: null
          });
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setError(response.data.message || 'Failed to register instructor');
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (userData: any) => {
    setShowOTPVerification(false);
    alert('Instructor registered and verified successfully!');
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      suffix: '',
      instructorId: '',
      program: '',
      faculty: '',
      gmail: '',
      idPhoto: null
    });
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
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
              {editingInstructor ? 'Edit Instructor' : 'Register New Instructor'}
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

            {/* Instructor ID */}
            <View>
              <Text className="text-gray-700 mb-1">Instructor ID *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                value={formData.instructorId}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instructorId: text }))}
                placeholder="Enter instructor ID"
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
              {loading ? 'Processing...' : editingInstructor ? 'Update Instructor' : 'Register Instructor'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <OTPVerification
        isVisible={showOTPVerification}
        email={registeredEmail}
        onClose={() => setShowOTPVerification(false)}
        onSuccess={handleOTPSuccess}
      />
    </>
  );
} 