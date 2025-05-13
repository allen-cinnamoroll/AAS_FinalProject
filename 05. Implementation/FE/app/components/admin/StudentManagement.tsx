import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, AlertButton, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../services/api';
import StudentRegistrationForm from './StudentRegistrationForm';
import EnrollStudentForm from './EnrollStudentForm';

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

  const handleDelete = async (studentId: string) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/students/${studentId}`);
              setStudents(students.filter(student => student._id !== studentId));
              Alert.alert('Success', 'Student deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete student');
            }
          },
        },
      ]
    );
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

  return (
    <View className="flex-1">
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
                    onPress={() => handleDelete(student._id)}
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