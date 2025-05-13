import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api';
import CourseRegistrationForm from './CourseRegistrationForm';

interface Course {
  _id: string;
  courseId: string;
  description: string;
  courseType: 'Lec' | 'Lab';
  units: number;
  term: '1' | '2';
  faculty: string;
  program: string;
  department?: string;
}

interface CourseManagementProps {
  setRefreshFunction?: (refreshFunc: () => Promise<void>) => void;
  isRefreshing?: boolean;
}

export default function CourseManagement({ setRefreshFunction, isRefreshing }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Memoize the fetch function to prevent it from changing on every render
  const fetchCoursesMemoized = React.useCallback(async () => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const response = await apiClient.get('/courses');
      const coursesData = Array.isArray(response.data) ? response.data : 
                        response.data.data ? response.data.data : 
                        [];
      setCourses(coursesData);
      return Promise.resolve();
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Failed to fetch courses');
      setCourses([]);
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchCoursesMemoized();
    
    // Register the refresh function with the parent component
    if (setRefreshFunction) {
      setRefreshFunction(fetchCoursesMemoized);
    }
  }, [fetchCoursesMemoized, setRefreshFunction]);

  const handleDelete = async (courseId: string) => {
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/courses/${courseId}`);
              setCourses(courses.filter(course => course._id !== courseId));
              Alert.alert('Success', 'Course deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (course: Course) => {
    // Create a compatible course object with the department field
    const compatibleCourse = {
      ...course,
      department: '' // Add empty department to match the expected interface
    };
    setEditingCourse(compatibleCourse as any);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <View className="flex-1">
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowAddForm(false);
              setEditingCourse(null);
            }}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <CourseRegistrationForm
          onSuccess={() => {
            setShowAddForm(false);
            setEditingCourse(null);
            fetchCoursesMemoized();
          }}
          editingCourse={editingCourse}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Course Management</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Add Course</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Loading courses...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {courses.map((course) => (
            <View
              key={course._id}
              className="bg-white rounded-lg shadow-sm p-4 mb-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {course.courseId}
                  </Text>
                  <Text className="text-gray-600">{course.description}</Text>
                  <View className="flex-row mt-2">
                    <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                      <Text className="text-blue-800 text-sm">
                        {course.courseType}
                      </Text>
                    </View>
                    <View className="bg-green-100 px-2 py-1 rounded-full mr-2">
                      <Text className="text-green-800 text-sm">
                        {course.units} Units
                      </Text>
                    </View>
                    <View className="bg-purple-100 px-2 py-1 rounded-full">
                      <Text className="text-purple-800 text-sm">
                        Term {course.term}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row mt-2">
                    <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                      <Text className="text-gray-800 text-sm">
                        {course.faculty}
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-2 py-1 rounded-full">
                      <Text className="text-gray-800 text-sm">
                        {course.program}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => handleEdit(course)}
                    className="p-2 mr-2"
                  >
                    <Ionicons name="pencil" size={20} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(course._id)}
                    className="p-2"
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
} 