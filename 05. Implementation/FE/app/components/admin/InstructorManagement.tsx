import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api';
import InstructorRegistrationForm from './InstructorRegistrationForm';
import AssignCourseForm from './AssignCourseForm';

interface Instructor {
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
}

interface InstructorManagementProps {
  setRefreshFunction?: (refreshFunc: () => Promise<void>) => void;
  isRefreshing?: boolean;
}

export default function InstructorManagement({ setRefreshFunction, isRefreshing }: InstructorManagementProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  // Memoize the fetch function to prevent it from changing on every render
  const fetchInstructorsMemoized = React.useCallback(async () => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const response = await apiClient.get('/instructors');
      const instructorsData = Array.isArray(response.data) ? response.data : 
                           response.data.data ? response.data.data : 
                           [];
      setInstructors(instructorsData);
      return Promise.resolve();
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
      setError(err.response?.data?.message || 'Failed to fetch instructors');
      setInstructors([]);
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchInstructorsMemoized();
    
    // Register the refresh function with the parent component
    if (setRefreshFunction) {
      setRefreshFunction(fetchInstructorsMemoized);
    }
  }, [fetchInstructorsMemoized, setRefreshFunction]);

  const handleDelete = async (instructorId: string) => {
    Alert.alert(
      'Delete Instructor',
      'Are you sure you want to delete this instructor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/instructors/${instructorId}`);
              setInstructors(instructors.filter(instructor => instructor._id !== instructorId));
              Alert.alert('Success', 'Instructor deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete instructor');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setShowAddForm(true);
  };

  const handleAssignCourse = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setShowAssignForm(true);
  };

  if (showAddForm) {
    return (
      <View className="flex-1">
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            {editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowAddForm(false);
              setEditingInstructor(null);
            }}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <InstructorRegistrationForm
          onSuccess={() => {
            setShowAddForm(false);
            setEditingInstructor(null);
            fetchInstructorsMemoized();
          }}
          editingInstructor={editingInstructor}
        />
      </View>
    );
  }

  if (showAssignForm && selectedInstructor) {
    return (
      <View className="flex-1">
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            Assign Course to {selectedInstructor.firstName} {selectedInstructor.lastName}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowAssignForm(false);
              setSelectedInstructor(null);
            }}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <AssignCourseForm
          onSuccess={() => {
            setShowAssignForm(false);
            setSelectedInstructor(null);
          }}
          instructorId={selectedInstructor._id}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Instructor Management</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Add Instructor</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Loading instructors...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {instructors.map((instructor) => (
            <View
              key={instructor._id}
              className="bg-white rounded-lg shadow-sm p-4 mb-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {instructor.firstName} {instructor.lastName}
                  </Text>
                  <Text className="text-gray-600">{instructor.instructorId}</Text>
                  <View className="flex-row mt-2">
                    <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                      <Text className="text-gray-800 text-sm">
                        {instructor.program}
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-2 py-1 rounded-full">
                      <Text className="text-gray-800 text-sm">
                        {instructor.faculty}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => handleAssignCourse(instructor)}
                    className="p-2 mr-2"
                  >
                    <Ionicons name="book" size={20} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEdit(instructor)}
                    className="p-2 mr-2"
                  >
                    <Ionicons name="pencil" size={20} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(instructor._id)}
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