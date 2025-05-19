import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api';
import { CourseFormData } from '../../types/forms';

interface CourseRegistrationFormProps {
  onSuccess?: () => void;
  editingCourse?: {
    _id: string;
    courseId: string;
    description: string;
    courseType: CourseFormData['courseType'];
    units: number;
    term: CourseFormData['term'];
    faculty: string;
    program: string;
  } | null;
}

const styles = StyleSheet.create({
  formIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  submitButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD'
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    marginRight: 8
  }
});

export default function CourseRegistrationForm({ onSuccess, editingCourse }: CourseRegistrationFormProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    courseId: '',
    description: '',
    courseType: 'Lec',
    units: 0,
    term: '1',
    faculty: '',
    program: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        courseId: editingCourse.courseId,
        description: editingCourse.description,
        courseType: editingCourse.courseType,
        units: editingCourse.units,
        term: editingCourse.term,
        faculty: editingCourse.faculty,
        program: editingCourse.program
      });
    }
  }, [editingCourse]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.courseId || !formData.description || !formData.courseType || 
          !formData.units || !formData.term || !formData.faculty || !formData.program) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate course ID format
      if (!/^[A-Z]{2,3}[0-9]{3}$/.test(formData.courseId)) {
        setError('Course ID must follow the format: ABC123 (2-3 letters followed by 3 numbers)');
        setLoading(false);
        return;
      }

      // Validate course type
      if (!['Lec', 'Lab'].includes(formData.courseType)) {
        setError('Course type must be either Lab or Lec');
        setLoading(false);
        return;
      }

      // Validate term
      if (!['1', '2'].includes(formData.term)) {
        setError('Term must be either 1 or 2');
        setLoading(false);
        return;
      }

      // Validate units
      const units = parseInt(formData.units.toString());
      if (isNaN(units) || units < 1 || units > 6) {
        setError('Units must be a number between 1 and 6');
        setLoading(false);
        return;
      }

      // Convert units to string for the form data
      const formDataToSend = {
        courseId: formData.courseId,
        description: formData.description,
        courseType: formData.courseType,
        units: units.toString(),
        term: formData.term,
        faculty: formData.faculty,
        program: formData.program
      };

      let response;
      if (editingCourse) {
        // Update existing course
        response = await apiClient.put(`/courses/${editingCourse._id}`, formDataToSend);
      } else {
        // Create new course
        response = await apiClient.post('/courses/register', formDataToSend);
      }

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save course');
      }

      alert(editingCourse ? 'Course updated successfully!' : 'Course registered successfully!');
      
      // Reset form
      setFormData({
        courseId: '',
        description: '',
        courseType: 'Lec',
        units: 0,
        term: '1',
        faculty: '',
        program: ''
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="p-4 space-y-6">
        {/* Form title card with icon */}
        <View className="bg-white p-5 rounded-lg shadow-sm flex-row items-center">
          <View style={styles.formIconContainer}>
            <Ionicons 
              name={editingCourse ? "create-outline" : "add-circle-outline"} 
              size={28} 
              color="#2563EB" 
            />
          </View>
          <View style={{flex: 1}}>
            <Text className="text-xl font-bold text-gray-800">
              {editingCourse ? 'Edit Course Details' : 'New Course Registration'}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              Please fill in all required fields marked with *
            </Text>
          </View>
        </View>

        {/* Course Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          {/* Section header with icon */}
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={22} color="#2563EB" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Course Information</Text>
          </View>

          {/* Course ID */}
          <View>
            <Text className="text-gray-700 mb-1">Course ID *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.courseId}
              onChangeText={(text) => setFormData(prev => ({ ...prev, courseId: text.toUpperCase() }))}
              placeholder="Enter course ID (e.g., ABC123)"
              autoCapitalize="characters"
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-gray-700 mb-1">Description *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter course description"
            />
          </View>
        </View>

        {/* Course Details Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          {/* Section header with icon */}
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={22} color="#7C3AED" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Course Details</Text>
          </View>

          {/* Course Type */}
          <View>
            <Text className="text-gray-700 mb-1">Course Type *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.courseType}
                onValueChange={(value: 'Lec' | 'Lab') => setFormData(prev => ({ ...prev, courseType: value }))}
              >
                <Picker.Item label="Lecture" value="Lec" />
                <Picker.Item label="Laboratory" value="Lab" />
              </Picker>
            </View>
          </View>

          {/* Units */}
          <View>
            <Text className="text-gray-700 mb-1">Units *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.units.toString()}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, units: parseInt(value) }))}
              >
                {[1, 2, 3, 4, 5, 6].map((unit) => (
                  <Picker.Item key={unit} label={`${unit} Unit${unit > 1 ? 's' : ''}`} value={unit.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Term */}
          <View>
            <Text className="text-gray-700 mb-1">Term *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.term}
                onValueChange={(value: '1' | '2') => setFormData(prev => ({ ...prev, term: value }))}
              >
                <Picker.Item label="First Term" value="1" />
                <Picker.Item label="Second Term" value="2" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Academic Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          {/* Section header with icon */}
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={22} color="#EC4899" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Academic Information</Text>
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
                name={editingCourse ? "save-outline" : "add-circle-outline"} 
                size={22} 
                color="#FFFFFF" 
                style={{marginRight: 8}} 
              />
              <Text style={styles.submitButtonText}>
                {editingCourse ? 'Update Course' : 'Register Course'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 