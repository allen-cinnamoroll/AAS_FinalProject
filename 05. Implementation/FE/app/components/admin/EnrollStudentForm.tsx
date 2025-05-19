import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface Course {
  _id: string;
  courseId: string;
  description: string;
}

interface AssignedCourse {
  _id: string;
  course: Course;
  section: string;
  schedule?: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

// For grouping courses by course ID
interface CourseWithSections {
  courseId: string;
  description: string;
  sections: {
    id: string;
    section: string;
    schedule?: {
      days: string[];
      startTime: string;
      endTime: string;
    };
  }[];
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gmail: string;
  studentId: string;
}

interface EnrollStudentFormProps {
  onSuccess?: () => void;
  studentId: string;
  studentName: string;
}

export default function EnrollStudentForm({ onSuccess, studentId, studentName }: EnrollStudentFormProps) {
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [groupedCourses, setGroupedCourses] = useState<CourseWithSections[]>([]);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number>(-1);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentsInSection, setStudentsInSection] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [enrolledCourseInfo, setEnrolledCourseInfo] = useState<{courseId: string, description: string, section: string} | null>(null);

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  // Group assigned courses by course ID, for better organization
  useEffect(() => {
    if (assignedCourses.length > 0) {
      const grouped: { [key: string]: CourseWithSections } = {};
      
      assignedCourses.forEach(assignedCourse => {
        const courseKey = assignedCourse.course.courseId;
        
        if (!grouped[courseKey]) {
          grouped[courseKey] = {
            courseId: assignedCourse.course.courseId,
            description: assignedCourse.course.description,
            sections: []
          };
        }
        
        grouped[courseKey].sections.push({
          id: assignedCourse._id,
          section: assignedCourse.section,
          schedule: assignedCourse.schedule
        });
      });
      
      setGroupedCourses(Object.values(grouped));
    }
  }, [assignedCourses]);

  // When section is selected, fetch students in that section
  useEffect(() => {
    if (selectedSectionId) {
      // Add a check to prevent unnecessary refetching if loading
      if (!loadingStudents) {
        fetchStudentsInSection(selectedSectionId);
      }
    } else {
      setStudentsInSection([]);
    }
  }, [selectedSectionId]);

  const fetchAssignedCourses = async () => {
    try {
      const response = await apiClient.get('/assigned-courses');
      console.log('Assigned courses response:', response.data);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure');
      }

      // Validate and filter courses
      const validCourses = response.data.data.filter((course: any) => 
        course && 
        course._id && 
        course.course && 
        course.course.courseId && 
        course.course.description &&
        course.section
      );

      if (validCourses.length === 0) {
        setError('No valid courses available for enrollment');
        return;
      }

      setAssignedCourses(validCourses);
    } catch (err: any) {
      console.error('Error fetching assigned courses:', err);
      setError('Failed to fetch available courses');
    }
  };

  const fetchStudentsInSection = async (sectionId: string) => {
    try {
      setLoadingStudents(true);
      const response = await apiClient.get(`/enrollments/section/${sectionId}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch students in section');
      }
      
      setStudentsInSection(response.data.data.map((enrollment: any) => enrollment.student));
    } catch (err: any) {
      console.error('Error fetching students in section:', err);
      // Not showing this error to avoid cluttering the UI
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!selectedSectionId) {
        setError('Please select a course section');
        return;
      }

      const response = await apiClient.post('/enrollments/enroll', {
        studentId,
        assignedCourseId: selectedSectionId
      });

      if (response.data.success) {
        // Store enrolled course info for success modal
        if (selectedCourseIndex >= 0 && selectedSectionId) {
          const courseInfo = groupedCourses[selectedCourseIndex];
          const sectionInfo = courseInfo.sections.find(section => section.id === selectedSectionId);
          
          if (courseInfo && sectionInfo) {
            setEnrolledCourseInfo({
              courseId: courseInfo.courseId,
              description: courseInfo.description,
              section: sectionInfo.section
            });
          }
        }
        
        // Show success modal instead of alert
        setShowSuccessModal(true);
        
        // Refresh the student list after successful enrollment
        fetchStudentsInSection(selectedSectionId);
      } else {
        throw new Error(response.data.message || 'Failed to enroll student');
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setError(err.response?.data?.message || 'An error occurred during enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (index: number) => {
    setSelectedCourseIndex(index);
    setSelectedSectionId(''); // Reset section when course changes
  };

  // Format schedule for display
  const formatSchedule = (schedule?: { days: string[], startTime: string, endTime: string }) => {
    if (!schedule) return '';
    return `${schedule.days.join(', ')} ${schedule.startTime}-${schedule.endTime}`;
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  // Success Modal Component
  const EnrollmentSuccessModal = () => (
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
          
          <Text style={styles.successTitle}>Enrollment Successful!</Text>
          
          <Text style={styles.successMessage}>
            The student has been successfully enrolled in the course.
          </Text>
          
          {enrolledCourseInfo && (
            <View style={styles.courseInfoCard}>
              <Ionicons name="book-outline" size={24} color="#3B82F6" style={styles.courseIcon} />
              <View>
                <Text style={styles.courseTitle}>
                  {enrolledCourseInfo.courseId} - {enrolledCourseInfo.description}
                </Text>
                <Text style={styles.sectionInfo}>Section {enrolledCourseInfo.section}</Text>
              </View>
            </View>
          )}
          
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

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Success Modal */}
      <EnrollmentSuccessModal />
      
      <View className="p-4 space-y-6">
        {/* Student Info Card */}
        <View className="bg-white p-5 rounded-lg shadow-sm">
          <View style={styles.studentInfoHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={26} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-800">Enroll Student</Text>
              <Text className="text-gray-600 mt-1">
                {studentName}
              </Text>
            </View>
          </View>
        </View>

        {/* Course Selection */}
        <View className="bg-white p-5 rounded-lg shadow-sm space-y-4">
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={22} color="#3B82F6" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Course Selection</Text>
          </View>

          {/* Course */}
          <View>
            <Text className="text-gray-700 mb-1">Select Course *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
              <Picker
                selectedValue={selectedCourseIndex}
                onValueChange={(itemValue) => handleCourseChange(Number(itemValue))}
              >
                <Picker.Item label="Select a course" value="-1" />
                {groupedCourses.map((course, index) => (
                  <Picker.Item 
                    key={index} 
                    label={`${course.courseId} - ${course.description}`} 
                    value={index} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Section */}
          {selectedCourseIndex >= 0 && (
            <View>
              <Text className="text-gray-700 mb-1">Select Section *</Text>
              <View className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                <Picker
                  selectedValue={selectedSectionId}
                  onValueChange={(itemValue) => setSelectedSectionId(String(itemValue))}
                >
                  <Picker.Item label="Select a section" value="" />
                  {groupedCourses[selectedCourseIndex]?.sections.map((section) => (
                    <Picker.Item 
                      key={section.id} 
                      label={`Section ${section.section} - ${formatSchedule(section.schedule)}`} 
                      value={section.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}
        </View>

        {/* Students in Section */}
        {selectedSectionId && (
          <View className="bg-white p-5 rounded-lg shadow-sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={22} color="#7C3AED" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">Current Enrollees</Text>
            </View>
            
            {loadingStudents ? (
              <View className="py-6 flex items-center justify-center">
                <ActivityIndicator size="small" color="#4B5563" />
                <Text className="text-gray-500 mt-2">Loading students...</Text>
              </View>
            ) : studentsInSection.length > 0 ? (
              <View className="space-y-3 mt-3">
                {studentsInSection.map((student) => (
                  <View key={student._id} style={styles.studentCard}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentInitials}>
                        {student.firstName ? student.firstName.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={styles.studentCardContent}>
                      <Text style={styles.studentCardName}>{`${student.firstName || ''} ${student.lastName || ''}`}</Text>
                      <Text style={styles.studentCardId}>ID: {student.studentId}</Text>
                      <Text style={styles.studentCardEmail}>{student.gmail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-8 mt-2 border border-gray-100 rounded-md bg-gray-50 items-center">
                <Ionicons name="information-circle-outline" size={36} color="#9CA3AF" />
                <Text className="text-gray-500 text-center mt-2">No students currently enrolled in this section</Text>
              </View>
            )}
          </View>
        )}

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#DC2626" style={{marginRight: 8}} />
            <Text className="text-red-600 flex-1">{error}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !selectedSectionId}
          style={[
            styles.submitButton,
            (loading || !selectedSectionId) && styles.submitButtonDisabled
          ]}
        >
          {loading ? (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <ActivityIndicator size="small" color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.submitButtonText}>Processing...</Text>
            </View>
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.submitButtonText}>Enroll Student</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Section styling
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  // Student cards in section
  studentCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentCardContent: {
    flex: 1,
  },
  studentCardName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 2,
  },
  studentCardId: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  studentCardEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  // Error container
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Submit button
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Success modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
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
    borderRadius: 8,
    width: '80%',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  courseInfoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIcon: {
    marginRight: 12,
  },
  courseTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1E40AF',
    marginBottom: 4,
  },
  sectionInfo: {
    fontSize: 14,
    color: '#3B82F6',
  }
}); 