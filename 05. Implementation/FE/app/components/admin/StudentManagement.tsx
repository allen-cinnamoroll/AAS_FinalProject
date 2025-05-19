import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, AlertButton, Modal, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../services/api';
import StudentRegistrationForm from './StudentRegistrationForm';
import EnrollStudentForm from './EnrollStudentForm';
import { getImageUrl } from '../../utils/imageUtils';

interface Student {
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
}

interface AssignedCourse {
  _id: string;
  course: {
    courseId: string;
    description: string;
  };
  section: string;
  schedule?: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

interface StudentManagementProps {
  setRefreshFunction?: (refreshFunc: () => Promise<void>) => void;
  isRefreshing?: boolean;
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  studentInfo: {
    marginBottom: 16,
  },
  studentName: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#6B7280',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#2563EB',
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
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
  studentImage: {
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

export default function StudentManagement({ setRefreshFunction, isRefreshing }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [enrolling, setEnrolling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  // Memoize the fetch function to prevent it from changing on every render
  const fetchStudentsMemoized = React.useCallback(async () => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const response = await apiClient.get('/students');
      // Ensure we're getting an array from the response
      const studentsData = Array.isArray(response.data) ? response.data : 
                         response.data.data ? response.data.data : 
                         [];
      setStudents(studentsData);
      return Promise.resolve();
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students');
      setStudents([]); // Set empty array on error
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchStudentsMemoized();
    
    // Register the refresh function with the parent component
    if (setRefreshFunction) {
      setRefreshFunction(fetchStudentsMemoized);
    }
    // Only re-run when setRefreshFunction or fetchStudentsMemoized changes
  }, [fetchStudentsMemoized, setRefreshFunction]);

  const handleDelete = async (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/students/${studentToDelete._id}`);
      setStudents(students.filter(student => student._id !== studentToDelete._id));
      setShowDeleteModal(false);
      setShowDeleteSuccessModal(true);
    } catch (err: any) {
      setShowDeleteModal(false);
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteSuccessModal = () => {
    setShowDeleteSuccessModal(false);
    setStudentToDelete(null);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowAddForm(true);
  };

  const handleEnroll = (student: Student) => {
    setSelectedStudent(student);
    setShowEnrollmentForm(true);
  };

  const handleEnrollmentSubmit = async () => {
    if (!selectedStudent || !selectedCourseId) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    try {
      setEnrolling(true);
      const enrollResponse = await apiClient.post('/enrollments/enroll', {
        studentId: selectedStudent._id,
        assignedCourseId: selectedCourseId
      });

      if (enrollResponse.data.success) {
        Alert.alert('Success', 'Student enrolled successfully');
        setShowEnrollmentForm(false);
        setSelectedCourseId('');
      } else {
        throw new Error(enrollResponse.data.message || 'Failed to enroll student');
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  if (showAddForm) {
    return (
      <View className="flex-1">
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowAddForm(false);
              setEditingStudent(null);
            }}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <StudentRegistrationForm
          onSuccess={() => {
            setShowAddForm(false);
            setEditingStudent(null);
            fetchStudentsMemoized();
          }}
          editingStudent={editingStudent}
        />
      </View>
    );
  }

  if (showEnrollmentForm && selectedStudent) {
    return (
      <View className="flex-1">
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            Enroll {selectedStudent.firstName} {selectedStudent.lastName}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowEnrollmentForm(false);
              setSelectedStudent(null);
            }}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <EnrollStudentForm
          onSuccess={() => {
            setShowEnrollmentForm(false);
            setSelectedStudent(null);
          }}
          studentId={selectedStudent._id}
          studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
        />
      </View>
    );
  }

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
          
          <Text style={styles.deleteTitle}>Delete Student</Text>
          
          <Text style={styles.deleteMessage}>
            Are you sure you want to delete {studentToDelete?.firstName} {studentToDelete?.lastName}?
            This action cannot be undone.
          </Text>
          
          {studentToDelete?.idPhoto?.url && (
            <Image 
              source={{ uri: getImageUrl(studentToDelete.idPhoto.url) }}
              style={styles.studentImage}
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
          
          <Text style={styles.successTitle}>Student Deleted</Text>
          
          <Text style={styles.successMessage}>
            The student has been successfully removed from the system.
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

  return (
    <View className="flex-1">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
      
      {/* Delete Success Modal */}
      <DeleteSuccessModal />
      
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Student Management</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Add Student</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Loading students...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {students.map((student) => (
            <View
              key={student._id}
              className="bg-white rounded-lg shadow-sm p-4 mb-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {student.firstName} {student.middleName} {student.lastName} {student.suffix}
                  </Text>
                  <Text className="text-gray-600">{student.studentId}</Text>
                  <Text className="text-gray-600">{student.gmail}</Text>
                  <View className="flex-row mt-2">
                    <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                      <Text className="text-blue-800 text-sm">
                        Year {student.yearLevel}
                      </Text>
                    </View>
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-green-800 text-sm">
                        {student.program}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => handleEnroll(student)}
                    className="p-2 mr-2"
                  >
                    <Ionicons name="book" size={20} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEdit(student)}
                    className="p-2 mr-2"
                  >
                    <Ionicons name="pencil" size={20} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(student)}
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