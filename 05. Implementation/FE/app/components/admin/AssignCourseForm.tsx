import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../services/api';

interface AssignCourseFormProps {
  onSuccess?: () => void;
  instructorId: string;
}

export default function AssignCourseForm({ onSuccess, instructorId }: AssignCourseFormProps) {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    courseId: '',
    section: '',
    schedule: {
      days: [],
      startTime: '',
      endTime: ''
    },
    semester: '1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get('/courses');
      setCourses(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.courseId || !formData.section || !formData.schedule.days.length || 
          !formData.schedule.startTime || !formData.schedule.endTime) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate time format
      const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/;
      if (!timeRegex.test(formData.schedule.startTime) || !timeRegex.test(formData.schedule.endTime)) {
        setError('Time must be in format: HH:MM AM/PM (e.g., 9:30 AM)');
        setLoading(false);
        return;
      }

      // Validate section format (uppercase)
      if (!/^[A-Z0-9]+$/.test(formData.section)) {
        setError('Section must contain only uppercase letters and numbers');
        setLoading(false);
        return;
      }

      const payload = {
        courseId: formData.courseId,
        instructorId,
        section: formData.section.toUpperCase(),
        schedule: {
          days: formData.schedule.days,
          startTime: formData.schedule.startTime,
          endTime: formData.schedule.endTime
        },
        semester: formData.semester
      };

      await apiClient.post('/assigned-courses/assign', payload);

      alert('Course assigned successfully!');
      
      // Reset form
      setFormData({
        courseId: '',
        section: '',
        schedule: {
          days: [],
          startTime: '',
          endTime: ''
        },
        semester: '1'
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Assignment error:', err);
      setError(err.response?.data?.message || 'An error occurred during assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="p-4 space-y-6">
        {/* Form Title */}
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-2">Assign Course</Text>
          <Text className="text-gray-600 text-sm">
            Please fill in all required fields marked with *
          </Text>
        </View>

        {/* Course Selection */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Course Details</Text>

          {/* Course */}
          <View>
            <Text className="text-gray-700 mb-1">Course *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.courseId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}
              >
                <Picker.Item label="Select a course" value="" />
                {courses.map((course: any) => (
                  <Picker.Item 
                    key={course._id} 
                    label={`${course.courseId} - ${course.description}`} 
                    value={course._id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Section */}
          <View>
            <Text className="text-gray-700 mb-1">Section *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={formData.section}
              onChangeText={(text) => setFormData(prev => ({ ...prev, section: text.toUpperCase() }))}
              placeholder="Enter section (e.g., A1)"
              autoCapitalize="characters"
            />
          </View>

          {/* Schedule */}
          <View>
            <Text className="text-gray-700 mb-1">Schedule *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50 mb-2">
              <Picker
                selectedValue={formData.schedule.days[0]}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  schedule: { ...prev.schedule, days: [value] }
                }))}
              >
                <Picker.Item label="Select day" value="" />
                <Picker.Item label="Monday" value="Monday" />
                <Picker.Item label="Tuesday" value="Tuesday" />
                <Picker.Item label="Wednesday" value="Wednesday" />
                <Picker.Item label="Thursday" value="Thursday" />
                <Picker.Item label="Friday" value="Friday" />
                <Picker.Item label="Saturday" value="Saturday" />
              </Picker>
            </View>
            <View className="flex-row space-x-2">
              <View className="flex-1">
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                  value={formData.schedule.startTime}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    schedule: { ...prev.schedule, startTime: text }
                  }))}
                  placeholder="Start (e.g., 9:30 AM)"
                />
                <Text className="text-xs text-gray-500 mt-1">Format: HH:MM AM/PM</Text>
              </View>
              <View className="flex-1">
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                  value={formData.schedule.endTime}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    schedule: { ...prev.schedule, endTime: text }
                  }))}
                  placeholder="End (e.g., 11:00 AM)"
                />
                <Text className="text-xs text-gray-500 mt-1">Format: HH:MM AM/PM</Text>
              </View>
            </View>
          </View>

          {/* Semester */}
          <View>
            <Text className="text-gray-700 mb-1">Semester *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <Picker
                selectedValue={formData.semester}
                onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
              >
                <Picker.Item label="First Semester" value="1" />
                <Picker.Item label="Second Semester" value="2" />
              </Picker>
            </View>
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
            {loading ? 'Processing...' : 'Assign Course'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 