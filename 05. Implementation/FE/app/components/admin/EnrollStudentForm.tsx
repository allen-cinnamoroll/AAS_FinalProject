import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../services/api';

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
  name: string;
  email: string;
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
        alert('Student enrolled successfully!');
        // Refresh the student list after successful enrollment
        fetchStudentsInSection(selectedSectionId);
        if (onSuccess) {
          onSuccess();
        }
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

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="p-4 space-y-6">
        {/* Form Title */}
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-2">Enroll Student</Text>
          <Text className="text-gray-600 text-sm">
            Enrolling: {studentName}
          </Text>
        </View>

        {/* Course Selection */}
        <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Course Details</Text>

          {/* Course */}
          <View>
            <Text className="text-gray-700 mb-1">Select Course *</Text>
            <View className="border border-gray-300 rounded-lg bg-gray-50">
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
              <View className="border border-gray-300 rounded-lg bg-gray-50">
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
          <View className="bg-white p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Students in Section
            </Text>
            
            {loadingStudents ? (
              <View className="py-4 flex items-center justify-center">
                <ActivityIndicator size="small" color="#4B5563" />
                <Text className="text-gray-500 mt-2">Loading students...</Text>
              </View>
            ) : studentsInSection.length > 0 ? (
              <View className="space-y-2">
                {studentsInSection.map((student) => (
                  <View key={student._id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <Text className="font-medium text-gray-800">{student.name}</Text>
                    <Text className="text-gray-600 text-sm">ID: {student.studentId}</Text>
                    <Text className="text-gray-500 text-xs">{student.email}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-4 border border-gray-100 rounded-md bg-gray-50">
                <Text className="text-gray-500 text-center">No students enrolled in this section</Text>
              </View>
            )}
          </View>
        )}

        {/* Error Message */}
        {error ? (
          <View className="bg-red-50 p-3 rounded-lg">
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !selectedSectionId}
          className={`p-4 rounded-lg ${loading || !selectedSectionId ? 'bg-blue-400' : 'bg-blue-600'}`}
        >
          <Text className="text-white text-center font-semibold">
            {loading ? 'Processing...' : 'Enroll Student'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 