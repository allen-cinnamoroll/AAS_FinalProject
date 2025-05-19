import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api';
import InstructorRegistrationForm from './InstructorRegistrationForm';
import AssignCourseForm from './AssignCourseForm';
import { getImageUrl } from '../../utils/imageUtils';

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
  instructorImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
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

export default function InstructorManagement({ setRefreshFunction, isRefreshing }: InstructorManagementProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

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

  const handleDelete = async (instructor: Instructor) => {
    setInstructorToDelete(instructor);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!instructorToDelete) return;
    
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/instructors/${instructorToDelete._id}`);
      setInstructors(instructors.filter(instructor => instructor._id !== instructorToDelete._id));
      setShowDeleteModal(false);
      setShowDeleteSuccessModal(true);
    } catch (err: any) {
      setShowDeleteModal(false);
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete instructor');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteSuccessModal = () => {
    setShowDeleteSuccessModal(false);
    setInstructorToDelete(null);
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
          
          <Text style={styles.deleteTitle}>Delete Instructor</Text>
          
          <Text style={styles.deleteMessage}>
            Are you sure you want to delete {instructorToDelete?.firstName} {instructorToDelete?.lastName}?
            This action cannot be undone.
          </Text>
          
          {instructorToDelete?.idPhoto?.url && (
            <Image 
              source={{ uri: getImageUrl(instructorToDelete.idPhoto.url) }}
              style={styles.instructorImage}
            />
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
          
          <Text style={styles.successTitle}>Instructor Deleted</Text>
          
          <Text style={styles.successMessage}>
            The instructor has been successfully removed from the system.
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
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
      
      {/* Delete Success Modal */}
      <DeleteSuccessModal />
      
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
                  <Text className="text-gray-600">{instructor.gmail}</Text>
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
                    onPress={() => handleDelete(instructor)}
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