import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, StyleSheet, ActivityIndicator } from 'react-native';
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 24,
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
  deleteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 16,
  },
  deleteMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  courseInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  courseInfoText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
  courseInfoLabel: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
  },
  successModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 24,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  successButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default function CourseManagement({ setRefreshFunction, isRefreshing }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

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

  const handleDelete = async (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/courses/${courseToDelete._id}`);
      setCourses(courses.filter(course => course._id !== courseToDelete._id));
      setShowDeleteModal(false);
      setShowDeleteSuccessModal(true);
    } catch (err: any) {
      setShowDeleteModal(false);
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteSuccessModal = () => {
    setShowDeleteSuccessModal(false);
    setCourseToDelete(null);
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContent}>
          <View style={styles.deleteIconContainer}>
            <Ionicons name="warning" size={40} color="#F59E0B" />
          </View>
          
          <Text style={styles.deleteTitle}>Delete Course</Text>
          
          <Text style={styles.deleteMessage}>
            Are you sure you want to delete this course? This action cannot be undone.
          </Text>
          
          {courseToDelete && (
            <View style={styles.courseInfo}>
              <Text style={styles.courseInfoText}>
                <Text style={styles.courseInfoLabel}>Course ID:</Text> {courseToDelete.courseId}
              </Text>
              <Text style={styles.courseInfoText}>
                <Text style={styles.courseInfoLabel}>Description:</Text> {courseToDelete.description}
              </Text>
              <Text style={styles.courseInfoText}>
                <Text style={styles.courseInfoLabel}>Type:</Text> {courseToDelete.courseType}
              </Text>
              <Text style={styles.courseInfoText}>
                <Text style={styles.courseInfoLabel}>Units:</Text> {courseToDelete.units}
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.deleteButton, styles.cancelButton]}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deleteButton, styles.confirmButton, deleteLoading && styles.disabledButton]}
              onPress={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Delete Success Modal
  const DeleteSuccessModal = () => (
    <Modal
      visible={showDeleteSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeDeleteSuccessModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={50} color="#059669" />
          </View>
          
          <Text style={styles.successTitle}>Course Deleted</Text>
          
          <Text style={styles.successMessage}>
            The course has been successfully removed from the system.
          </Text>
          
          <TouchableOpacity
            style={styles.successButton}
            onPress={closeDeleteSuccessModal}
          >
            <Text style={styles.successButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
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
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
      
      {/* Delete Success Modal */}
      <DeleteSuccessModal />
      
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
                    onPress={() => handleDelete(course)}
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