import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
        {/* Form Title */}
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            {editingCourse ? 'Edit Course' : 'Register New Course'}
          </Text>
          <Text className="text-gray-600 text-sm">
            Please fill in all required fields marked with *
          </Text>
        </View>

        {/* Course Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Course Information</Text>

          {/* Course ID */}
          <View>
            <Text className="text-gray-700 mb-1">Course ID *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.courseId}
              onChangeText={(text) => setFormData(prev => ({ ...prev, courseId: text }))}
              placeholder="Enter course ID"
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
          <Text className="text-lg font-semibold text-gray-800 mb-2">Course Details</Text>

          {/* Course Type */}
          <View>
            <Text className="text-gray-700 mb-1">Course Type *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.courseType}
                onValueChange={(value: CourseFormData['courseType']) => setFormData(prev => ({ ...prev, courseType: value }))}
              >
                <Picker.Item label="Lecture" value="Lec" />
                <Picker.Item label="Laboratory" value="Lab" />
              </Picker>
            </View>
          </View>

          {/* Units */}
          <View>
            <Text className="text-gray-700 mb-1">Units *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.units.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, units: parseInt(text) || 0 }))}
              placeholder="Enter number of units"
              keyboardType="numeric"
            />
          </View>

          {/* Term */}
          <View>
            <Text className="text-gray-700 mb-1">Term *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.term}
                onValueChange={(value: CourseFormData['term']) => setFormData(prev => ({ ...prev, term: value }))}
              >
                <Picker.Item label="First Semester" value="1" />
                <Picker.Item label="Second Semester" value="2" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Academic Information Section */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Academic Information</Text>

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
            {loading ? 'Processing...' : editingCourse ? 'Update Course' : 'Register Course'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 