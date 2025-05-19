import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Platform, Alert, Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredStudentData, setRegisteredStudentData] = useState<any>(null);

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

      // Only require photo for new registrations, not for updates
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

      // Add photo if it exists and has changed
      if (formData.idPhoto) {
        // For update operations where the photo hasn't changed, don't re-upload
        const isNewPhoto = !editingStudent?.idPhoto || 
                         (formData.idPhoto.uri !== getImageUrl(editingStudent.idPhoto.url));
        
        if (!editingStudent || isNewPhoto) {
          // Only attach photo if it's new or this is a new student
          formDataToSend.append('idPhoto', {
            uri: formData.idPhoto.uri,
            type: 'image/jpeg',
            name: 'photo.jpg'
          } as any);
        } else {
          // For web platform, add a flag to indicate we're keeping the existing photo
          formDataToSend.append('keepExistingPhoto', 'true');
        }
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
          setRegisteredStudentData({
            ...response.data.data,
            isUpdate: true
          });
          setShowSuccessModal(true);
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
          setRegisteredStudentData({
            ...response.data.data,
            isUpdate: false
          });
          setShowSuccessModal(true);
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

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  // Success modal to show after successful registration/update
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeSuccessModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={70} color="#059669" />
          </View>
          
          <Text style={styles.successTitle}>
            {registeredStudentData?.isUpdate ? 'Student Updated!' : 'Registration Successful!'}
          </Text>
          
          <Text style={styles.successMessage}>
            {registeredStudentData?.isUpdate 
              ? 'The student information has been successfully updated in the system.' 
              : 'The student has been successfully registered and can now be enrolled in courses.'}
          </Text>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeSuccessModal}
          >
            <Text style={styles.closeButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (registered && !showSuccessModal) {
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
      {/* Success Modal */}
      <SuccessModal />
      
      <View className="p-4 space-y-6">
        {/* Form title card with icon */}
        <View className="bg-white p-5 rounded-lg shadow-sm flex-row items-center">
          <View style={styles.formIconContainer}>
            <Ionicons 
              name={editingStudent ? "create-outline" : "person-add-outline"} 
              size={28} 
              color="#2563EB" 
            />
          </View>
          <View style={{flex: 1}}>
            <Text className="text-xl font-bold text-gray-800">
              {editingStudent ? 'Edit Student Profile' : 'New Student Registration'}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              Please fill in all required fields marked with *
            </Text>
          </View>
        </View>

        {/* Profile Photo Upload - Enhanced UI */}
        <View className="items-center">
          <View className="relative">
            <View style={styles.photoContainer}>
              {formData.idPhoto ? (
                <Image
                  source={{ uri: formData.idPhoto.uri }}
                  style={styles.photo}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={50} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">ID Photo</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.uploadButton}
            >
              <Ionicons name="camera" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-600 mt-2 text-sm">Upload Student ID Photo *</Text>
        </View>

        {/* Personal Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          {/* Section header with icon */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={22} color="#2563EB" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Personal Information</Text>
          </View>
          
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
          {/* Section header with icon */}
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={22} color="#7C3AED" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Academic Information</Text>
          </View>
          
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
          {/* Section header with icon */}
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={22} color="#EC4899" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Contact Information</Text>
          </View>
          
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

        {/* Error Message - Enhanced UI */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#DC2626" style={{marginRight: 8}} />
            <Text className="text-red-600 flex-1">{error}</Text>
          </View>
        ) : null}

        {/* Submit Button - Enhanced UI */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[
            styles.submitButton,
            loading ? styles.submitButtonDisabled : {}
          ]}
        >
          {loading ? (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <View style={styles.loadingIndicator} />
              <Text style={styles.submitButtonText}>Processing...</Text>
            </View>
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Ionicons 
                name={editingStudent ? "save-outline" : "add-circle-outline"} 
                size={22} 
                color="#FFFFFF" 
                style={{marginRight: 8}} 
              />
              <Text style={styles.submitButtonText}>
                {editingStudent ? 'Update Student' : 'Register Student'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 20,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '80%',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Enhanced form UI styles
  formIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
    marginRight: 10,
    transform: [{ rotate: '45deg' }],
  },
}); 