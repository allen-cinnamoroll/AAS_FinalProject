import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Constant for web platform detection
const isWeb = Platform.OS === 'web';

interface InstructorDashboardProps {
  userData: any;
  onLogout: () => void;
}

// Create a QR scanner component that handles platform differences
const QRScannerComponent = ({ 
  onScan, 
  scanned, 
  setScanned, 
  hasPermission,
  styles
}: { 
  onScan: (data: string) => void, 
  scanned: boolean, 
  setScanned: (value: boolean) => void,
  hasPermission: boolean | null,
  styles: any
}) => {
  const [manualInput, setManualInput] = useState('');
  
  console.log('QRScannerComponent rendering with hasPermission:', hasPermission, 'isWeb:', isWeb);
  
  // On web, provide a manual entry fallback
  if (isWeb) {
    console.log('Using web fallback for QR scanner');
    return (
      <View style={styles.qrScannerWebFallback}>
        <Text style={styles.qrScannerTitle}>Enter Student QR Code Data</Text>
        <Text style={styles.qrScannerWebInstructions}>
          For web platforms, please enter the QR code data manually:
        </Text>
        
        <TextInput
          style={styles.qrScannerTextInput}
          value={manualInput}
          onChangeText={setManualInput}
          placeholder='Enter QR code data (e.g. {"studentId":"123","sectionId":"456"})'
          multiline
        />
        
        <Pressable 
          style={styles.qrRescanButton}
          onPress={() => {
            if (manualInput.trim()) {
              console.log('Manual QR code data submitted:', manualInput);
              onScan(manualInput);
            } else {
              Alert.alert('Error', 'Please enter valid QR code data');
            }
          }}
        >
          <Text style={styles.qrRescanButtonText}>Submit</Text>
        </Pressable>
      </View>
    );
  }
  
  // Native platform scanner
  if (hasPermission === null) {
    console.log('Camera permission status is null, requesting...');
    return (
      <View style={styles.qrScannerMessage}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    console.log('Camera permission denied');
    return (
      <View style={styles.qrScannerMessage}>
        <Text>No access to camera. Please enable camera permissions to scan QR codes.</Text>
      </View>
    );
  }
  
  console.log('Rendering camera for QR scanning, scanned status:', scanned);
  
  return (
    <View style={styles.qrScannerCameraContainer}>
      <CameraView
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : (result) => {
          console.log('Barcode detected by CameraView:', result);
          onScan(result.data);
        }}
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }}
        onCameraReady={() => console.log('Camera is ready')}
        onMountError={(error) => console.error('Camera mount error:', error)}
      >
        <View style={styles.qrScannerOverlay}>
          <View style={styles.qrScannerTargetBox}>
            <View style={styles.qrCornerTL} />
            <View style={styles.qrCornerTR} />
            <View style={styles.qrCornerBL} />
            <View style={styles.qrCornerBR} />
          </View>
          
          <View style={styles.qrScannerHintContainer}>
            <Ionicons name="qr-code" size={24} color="#FFFFFF" style={styles.qrScannerHintIcon} />
            <Text style={styles.qrScannerHint}>
              Position the QR code within the frame
            </Text>
          </View>
        </View>
        
        {scanned && (
          <View style={styles.qrRescanButtonContainer}>
            <Pressable 
              style={styles.qrRescanButton}
              onPress={() => {
                console.log('Resetting scan state to scan again');
                setScanned(false);
              }}
            >
              <Text style={styles.qrRescanButtonText}>Tap to Scan Again</Text>
            </Pressable>
          </View>
        )}
      </CameraView>
    </View>
  );
};

export default function InstructorDashboard({ userData, onLogout }: InstructorDashboardProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'subjects' | 'profile'>('subjects');
  const [instructorData, setInstructorData] = useState<any>(null);
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = Platform.OS !== 'web';
  
  // New state for navigation between courses, sections, and students
  const [viewMode, setViewMode] = useState<'courses' | 'sections' | 'students'>('courses');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  
  // Attendance action states
  const [attendanceStatuses, setAttendanceStatuses] = useState<{[key: string]: string}>({});
  const [processingAttendance, setProcessingAttendance] = useState<{[key: string]: boolean}>({});
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState<any>(null);
  
  // Success modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successStudent, setSuccessStudent] = useState<any>(null);
  
  // Use the camera permissions hook
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Add these state variables to the component
  useEffect(() => {
    fetchInstructorData();
  }, []);
  
  // Request camera permissions when QR scanner is shown
  useEffect(() => {
    if (showQRScanner && Platform.OS !== 'web') {
      console.log('QR Scanner shown, requesting camera permissions...');
      (async () => {
        try {
          console.log('Requesting camera permission...');
          const result = await requestCameraPermission();
          console.log('Camera permission result:', result);
          setHasPermission(result.granted);
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          setHasPermission(false);
        }
      })();
    } else if (Platform.OS === 'web') {
      console.log('Web platform detected, skipping camera permission request');
      // On web, we don't need camera permissions for our fallback
      setHasPermission(true);
    }
  }, [showQRScanner, requestCameraPermission]);

  const fetchInstructorData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Current token (first 20 chars):', token.substring(0, 20) + '...');

      // Get user data from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        throw new Error('No user data found');
      }

      const userData = JSON.parse(userDataString);
      console.log('User data:', userData);

      if (!userData.userType || userData.userType !== 'instructor') {
        throw new Error('Invalid user type. Expected: instructor, Got: ' + (userData.userType || 'undefined'));
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const url = `${baseUrl}/api/instructors/${userData.id}`;
      
      console.log('Fetching instructor data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch instructor data');
      }

      // Construct full image URL
      if (data.data.idPhoto) {
        data.data.idPhoto.url = `${baseUrl}/${data.data.idPhoto.url}`;
      }

      setInstructorData(data.data);
      setError(null);

      // Fetch assigned courses after getting instructor data
      await fetchAssignedCourses(token, baseUrl);
    } catch (error: unknown) {
      console.error('Error fetching instructor data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch instructor data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedCourses = async (token: string, baseUrl: string) => {
    try {
      const url = `${baseUrl}/api/instructors/courses`;
      console.log('Fetching assigned courses from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      console.log('Courses response status:', response.status);
      const data = await response.json();
      console.log('Courses response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assigned courses');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch assigned courses');
      }

      setAssignedCourses(data.courses || []);
    } catch (error: unknown) {
      console.error('Error fetching assigned courses:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch assigned courses');
    }
  };

  // New function to fetch today's attendance records for the current section
  const fetchTodayAttendance = async (sectionId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const today = new Date().toISOString().split('T')[0];
      const url = `${baseUrl}/api/attendance/section/${sectionId}?date=${today}`;
      
      console.log('Fetching today\'s attendance records:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      console.log('Attendance response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      
      const data = await response.json();
      console.log('Today\'s attendance records:', data);
      
      if (data.success && data.data) {
        // Update the attendance statuses based on today's records
        const newStatuses = { ...attendanceStatuses };
        
        data.data.forEach((record: any) => {
          if (record.student && record.student._id) {
            newStatuses[record.student._id] = record.status;
            console.log(`Setting status for student ${record.student._id} to ${record.status}`);
          }
        });
        
        setAttendanceStatuses(newStatuses);
        console.log('Updated attendance statuses:', newStatuses);
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching today\'s attendance:', error);
      return [];
    }
  };

  // Modified function to fetch students for a section
  const fetchStudentsForSection = async (sectionId: string) => {
    try {
      setLoadingStudents(true);
      // Save the current statuses before loading new data
      const currentStatuses = { ...attendanceStatuses };
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const url = `${baseUrl}/api/sections/${sectionId}/students`;
      
      console.log('Fetching students for section:', url);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
        });

        console.log('Students response status:', response.status);
        const data = await response.json();
        console.log('Students response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch students');
        }

        // Process student data to ensure photo URLs are correct and attendance is properly formatted
        const processedStudents = (data.students || []).map((student: any) => {
          // Handle photo URL
          if (student && student.idPhoto && student.idPhoto.url) {
            // If URL is relative, make it absolute
            if (!student.idPhoto.url.startsWith('http')) {
              // Remove any leading slash in the URL to avoid double slashes
              const photoUrl = student.idPhoto.url.startsWith('/') 
                ? student.idPhoto.url.substring(1) 
                : student.idPhoto.url;
              
              // Construct the full URL
              student.idPhoto.url = `${baseUrl}/${photoUrl}`;
            }
          }
          
          // Ensure fullName is always present
          if (!student.fullName && student.firstName) {
            const middleInitial = student.middleName ? `${student.middleName.charAt(0)}. ` : '';
            const suffixStr = student.suffix ? ` ${student.suffix}` : '';
            student.fullName = `${student.firstName} ${middleInitial}${student.lastName}${suffixStr}`.trim();
          }
          
          // Ensure attendance percentage is properly formatted
          let attendancePercentage = 0;
          
          // Parse attendance from enrollment if available
          if (student.enrollment && student.enrollment.attendance && 
              typeof student.enrollment.attendance.percentage === 'number') {
            attendancePercentage = student.enrollment.attendance.percentage;
            console.log(`Student ${student._id} has enrollment attendance: ${attendancePercentage}%`);
          } 
          // Try direct attendance object if available
          else if (student.attendance && typeof student.attendance.percentage === 'number') {
            attendancePercentage = student.attendance.percentage;
            console.log(`Student ${student._id} has direct attendance: ${attendancePercentage}%`);
          }
          // Try direct attendance number if available
          else if (typeof student.attendance === 'number') {
            attendancePercentage = student.attendance;
            console.log(`Student ${student._id} has numeric attendance: ${attendancePercentage}%`);
          }
          
          // Set the normalized attendance value
          student.attendance = attendancePercentage;
          
          return student;
        });

        console.log('Processed students with attendance:', processedStudents);
        setStudents(processedStudents);
        
        // Restore or update attendance statuses first from current UI state
        if (processedStudents.length > 0) {
          const newStatuses = { ...currentStatuses };
          
          // Check if we have attendance data from the API that indicates status
          processedStudents.forEach((student: any) => {
            // If this student already has a status in the current UI, preserve it
            if (currentStatuses[student._id]) {
              newStatuses[student._id] = currentStatuses[student._id];
            } 
            // Otherwise, try to determine status from backend attendance data if available
            else if (student.attendance === 100) {
              // If attendance is 100%, mark as present for today
              newStatuses[student._id] = 'present';
            }
            // Add more logic here if the backend provides status information
          });
          
          setAttendanceStatuses(newStatuses);
          
          // Remove this line to prevent potential update loops
          // The useEffect that monitors students will handle this call instead
          // await fetchTodayAttendance(sectionId);
        }
        
        // Update the selectedSection's enrolledStudents count with the actual number of students
        if (selectedSection) {
          const updatedSection = { 
            ...selectedSection, 
            enrolledStudents: processedStudents.length 
          };
          setSelectedSection(updatedSection);
          
          // Also update this section's count in the parent course if available
          if (selectedCourse) {
            const updatedCourse = { ...selectedCourse };
            const sectionIndex = updatedCourse.sections.findIndex(
              (s: any) => s._id === selectedSection._id
            );
            
            if (sectionIndex !== -1) {
              updatedCourse.sections[sectionIndex].enrolledStudents = processedStudents.length;
              setSelectedCourse(updatedCourse);
            }
          }
        }
      } catch (error) {
        console.error('API error, using mock data:', error);
        // In case the API doesn't exist yet, use mock data
        const mockStudents = [
          {
            _id: '1',
            firstName: 'John',
            lastName: 'Smith',
            fullName: 'John Smith',
            studentId: '2023-1234',
            program: 'Computer Science',
            yearLevel: '3',
            faculty: 'Information Technology',
            attendance: 95,
          },
          {
            _id: '2',
            firstName: 'Maria',
            lastName: 'Garcia',
            middleName: 'Rose',
            fullName: 'Maria Rose Garcia',
            studentId: '2023-1235',
            program: 'Information Technology',
            yearLevel: '2',
            faculty: 'Information Technology',
            attendance: 88,
          },
          {
            _id: '3',
            firstName: 'David',
            lastName: 'Lee',
            fullName: 'David Lee',
            studentId: '2023-1236',
            program: 'Computer Science',
            yearLevel: '4',
            faculty: 'Information Technology',
            attendance: 90,
          },
          {
            _id: '4',
            firstName: 'Sarah',
            lastName: 'Johnson',
            fullName: 'Sarah Johnson',
            studentId: '2023-1237',
            program: 'Information Technology',
            yearLevel: '1',
            faculty: 'Information Technology',
            attendance: 92,
          },
          {
            _id: '5',
            firstName: 'Michael',
            lastName: 'Brown',
            middleName: 'James',
            suffix: 'Jr.',
            fullName: 'Michael James Brown Jr.',
            studentId: '2023-1238',
            program: 'Computer Science',
            yearLevel: '3',
            faculty: 'Information Technology',
            attendance: 85,
          },
        ];
        console.log('Using mock student data:', mockStudents);
        setStudents(mockStudents);
        
        // Restore attendance statuses for the mock data
        if (mockStudents.length > 0) {
          const newStatuses = { ...currentStatuses };
          setAttendanceStatuses(newStatuses);
        }
        
        // Update the selectedSection's enrolledStudents count with the mock data length
        if (selectedSection) {
          const updatedSection = {
            ...selectedSection,
            enrolledStudents: mockStudents.length
          };
          setSelectedSection(updatedSection);
        }
      }
      
      setError(null);
    } catch (error: unknown) {
      console.error('Error fetching students:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch students');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const formatSchedule = (schedule: any) => {
    if (!schedule) return 'No schedule';
    if (typeof schedule === 'string') return schedule;
    
    const { days, startTime, endTime } = schedule;
    return `${days.join(', ')} ${startTime} - ${endTime}`;
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to logout?')) {
        onLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Yes',
            onPress: onLogout
          }
        ]
      );
    }
  };

  // Handle selecting a course to view its sections
  const handleCourseSelect = (course: any) => {
    // Ensure sections are sorted alphabetically by sectionCode
    const sortedCourse = {
      ...course,
      sections: [...course.sections].sort((a, b) => 
        a.sectionCode.localeCompare(b.sectionCode)
      )
    };
    
    setSelectedCourse(sortedCourse);
    setViewMode('sections');
  };

  // Handle selecting a section to view its students
  const handleSectionSelect = (section: any) => {
    console.log('Selected section with enrolledStudents:', section.enrolledStudents);
    setSelectedSection(section);
    setViewMode('students');
    fetchStudentsForSection(section._id);
  };

  // Handle navigation back
  const handleBack = () => {
    if (viewMode === 'students') {
      setViewMode('sections');
      setStudents([]);
      setSelectedSection(null);
    } else if (viewMode === 'sections') {
      setViewMode('courses');
      setSelectedCourse(null);
    }
  };
  
  // Modified recordAttendance function with enhanced debug logging
  const recordAttendance = async (studentId: string, sectionId: string, enrollmentId?: string) => {
    try {
      console.log('Starting attendance recording process...');
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }
      
      console.log('Using token:', token);
      
      // Try to decode the token to verify it contains the instructor ID
      try {
        // Simple decode - just to check structure, not for verification
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', payload);
        }
      } catch (err) {
        console.log('Could not decode token for debugging:', err);
      }

      // Find the student in the current section to get the correct ID format
      const student = students.find(s => 
        s._id === studentId || 
        s.studentId === studentId ||
        s._id?.toString() === studentId?.toString() ||
        s.studentId?.toString() === studentId?.toString()
      );
      
      if (!student) {
        console.log('Note: Student not found in the current student list:', studentId);
        console.log('Will attempt to use the provided ID directly');
      } else {
        console.log('Found student in current list:', student._id, student.fullName);
      }
      
      // Use the matching student ID if found, otherwise use the original
      const effectiveStudentId = student ? (student._id || student.studentId) : studentId;
      console.log('Using student ID for attendance:', effectiveStudentId);

      // Debug section data
      console.log('Selected section:', selectedSection);
      if (selectedCourse) {
        console.log('Current course:', {
          _id: selectedCourse._id,
          courseId: selectedCourse.courseId
        });
      }

      // Get the section ID - this could be from various places
      const effectiveSectionId = sectionId || selectedSection?._id || selectedSection?.course;
      console.log('Using sectionId for attendance:', effectiveSectionId);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const url = `${baseUrl}/api/attendance/record`;
      console.log('Sending attendance record to:', url);
      
      const requestBody = {
        studentId: effectiveStudentId,
        sectionId: effectiveSectionId,
        date: new Date().toISOString(),
        enrollmentId: enrollmentId || undefined,
      };
      console.log('Request body:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        console.error('API error:', data.message || 'Failed to record attendance');
        throw new Error(data.message || 'Failed to record attendance');
      }
      
      console.log('Attendance recorded successfully');
      
      // Update the attendance status to "present" in the UI
      if (student) {
        console.log('Setting attendance status to PRESENT for student:', student._id);
        
        // Update the attendance status for this student
        setAttendanceStatuses(prev => {
          const updatedStatuses = { ...prev, [student._id]: 'present' };
          console.log('Updated attendance statuses:', updatedStatuses);
          return updatedStatuses;
        });
      } else {
        console.log('Student not found in current list - cannot update UI status');
      }
      
      // Update the local student record with the new attendance percentage if available
      if (student && data.data && data.data.attendancePercentage !== undefined) {
        const newAttendancePercentage = data.data.attendancePercentage;
        console.log(`Updating local student record with new attendance percentage: ${newAttendancePercentage}% (old: ${student.attendance}%)`);
        
        // Update the student in the array
        const updatedStudents = students.map(s => {
          if ((s._id === studentId || s.studentId === studentId)) {
            return { ...s, attendance: newAttendancePercentage };
          }
          return s;
        });
        
        setStudents(updatedStudents);
      } else {
        console.log('No attendance percentage returned from backend or student not found in current list');
      }
      
      return data;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  };
  
  // Handle QR code scan
  const handleBarCodeScanned = (data: string) => {
    setScanned(true);
    console.log('QR Code scanned! Raw data:', data);
    console.log('Current attendance statuses before scan:', attendanceStatuses);
    
    try {
      // Try to parse the QR code data
      let qrData;
      try {
        qrData = JSON.parse(data);
        console.log('Parsed QR data:', qrData);
      } catch (parseError) {
        console.log('QR code is not in JSON format, attempting to use as studentId directly');
        // If the QR code is not JSON, treat the raw data as a student ID
        qrData = {
          studentId: data.trim(), // Use the raw data as studentId
        };
      }
      
      // Debug section information for troubleshooting
      if (selectedSection) {
        console.log('Selected section details:', {
          _id: selectedSection._id,
          sectionCode: selectedSection.sectionCode,
          course: selectedSection.course || 'Not available'
        });
      } else {
        console.log('No section currently selected');
      }
      
      // Check if the scanned data contains a studentId
      if (qrData.studentId) {
        console.log('StudentID found in QR data:', qrData.studentId);
        
        // First check if we have an enrollmentId - this is the preferred way
        if (qrData.enrollmentId) {
          console.log('EnrollmentID found in QR data:', qrData.enrollmentId);
          
          // We need to verify if this enrollment belongs to the current section
          // For now, we'll just check if the sectionId matches
          if (qrData.sectionId && selectedSection && 
             (qrData.sectionId === selectedSection._id || qrData.sectionId === selectedSection.course)) {
            console.log('SectionID in QR matches current section:', selectedSection._id);
            
            // Since we have a matching section, we'll assume the student is enrolled in this section
            console.log('Attempting to record attendance using enrollment ID:', qrData.enrollmentId);
            // Record attendance in the backend
            recordAttendance(qrData.studentId, qrData.sectionId, qrData.enrollmentId)
              .then((response) => {
                console.log('Attendance recorded successfully:', response);
                // Find the student by ID
                const student = students.find(s => 
                  s._id === qrData.studentId || 
                  s.studentId === qrData.studentId
                );
                
                // Update the status badge to show 'present' if student is in the current view
                if (student) {
                  console.log('QR Success: Setting status to PRESENT for student:', student._id);
                  setAttendanceStatuses(prev => {
                    const updatedStatuses = { ...prev, [student._id]: 'present' };
                    console.log('QR Success: Updated attendance statuses:', updatedStatuses);
                    return updatedStatuses;
                  });
                  
                  // Show success modal with student details
                  setSuccessStudent({
                    ...student,
                    section: selectedSection?.sectionCode || '',
                    course: selectedCourse?.courseId || selectedCourse?.courseCode || ''
                  });
                  setShowSuccessModal(true);
                  setShowQRScanner(false);
                } else {
                  console.log('QR Success: Student not found in local list for status update');
                  // Try to get student info from QR data if available
                  const studentInfo = {
                    _id: qrData.studentId,
                    fullName: qrData.name || 'Student',
                    studentId: qrData.studentId,
                    section: selectedSection?.sectionCode || '',
                    course: selectedCourse?.courseId || selectedCourse?.courseCode || ''
                  };
                  
                  setSuccessStudent(studentInfo);
                  setShowSuccessModal(true);
                  setShowQRScanner(false);
                  
                  // Refresh the student list to include this student
                  fetchStudentsForSection(selectedSection._id);
                }
              })
              .catch((error) => {
                console.error('Failed to record attendance:', error);
                Alert.alert(
                  "Error",
                  `Failed to record attendance: ${error.message}`,
                  [
                    { 
                      text: "Try Again", 
                      onPress: () => setScanned(false) 
                    },
                    { 
                      text: "Cancel", 
                      onPress: () => {
                        setShowQRScanner(false);
                        setScanned(false);
                      }
                    }
                  ]
                );
              });
          } else {
            console.log('Section mismatch or missing section ID');
            console.log('QR sectionId:', qrData.sectionId);
            console.log('Current sectionId:', selectedSection?._id);
            Alert.alert(
              "Wrong Section",
              "The scanned QR code is for a different class or section.",
              [
                { 
                  text: "Try Again", 
                  onPress: () => setScanned(false) 
                },
                { 
                  text: "Cancel", 
                  onPress: () => {
                    setShowQRScanner(false);
                    setScanned(false);
                  }
                }
              ]
            );
          }
        } 
        // Fall back to the old method if enrollmentId is not available
        else {
          // If sectionId is missing but we have a selected section, use the current section's ID
          if (!qrData.sectionId && selectedSection) {
            console.log('SectionID missing in QR data, using current section:', selectedSection._id);
            qrData.sectionId = selectedSection._id;
          }
          
          // Now check if we have both required fields
          if (qrData.sectionId) {
            console.log('Using SectionID:', qrData.sectionId, 'Current section:', selectedSection?._id);
            
            // Check if the scanned section ID matches the current section
            if (selectedSection && (qrData.sectionId === selectedSection._id || qrData.sectionId === selectedSection.course)) {
              // Print all student IDs for debugging
              console.log('Available student IDs in this section:');
              students.forEach(student => console.log(`- ${student._id} (${student.studentId})`));
              
              // Check if the scanned student ID exists in the student list
              // Try matching against both _id and studentId fields
              const studentExists = students.some(student => 
                student._id === qrData.studentId || 
                student.studentId === qrData.studentId
              );
              
              console.log('Student exists in current view:', studentExists);
              
              // Proceed with attendance recording regardless - the backend will validate if the student
              // is actually enrolled in the section
              console.log('Attempting to record attendance for student:', qrData.studentId);
              recordAttendance(qrData.studentId, qrData.sectionId)
                .then((response) => {
                  console.log('Attendance recorded successfully:', response);
                  // Find the student by ID
                  const student = students.find(s => 
                    s._id === qrData.studentId || 
                    s.studentId === qrData.studentId
                  );
                  
                  // Update the status badge to show 'present' if the student is found in the current view
                  if (student) {
                    console.log('QR Success: Setting status to PRESENT for student:', student._id);
                    setAttendanceStatuses(prev => {
                      const updatedStatuses = { ...prev, [student._id]: 'present' };
                      console.log('QR Success: Updated attendance statuses:', updatedStatuses);
                      return updatedStatuses;
                    });
                    
                    // Show success modal with student details
                    setSuccessStudent({
                      ...student,
                      section: selectedSection?.sectionCode || '',
                      course: selectedCourse?.courseId || selectedCourse?.courseCode || ''
                    });
                    setShowSuccessModal(true);
                    setShowQRScanner(false);
                  } else {
                    console.log('QR Success: Student not found in local list for status update');
                    
                    // Try to get student info from QR data if available
                    const studentInfo = {
                      _id: qrData.studentId,
                      fullName: qrData.name || 'Student',
                      studentId: qrData.studentId,
                      section: selectedSection?.sectionCode || '',
                      course: selectedCourse?.courseId || selectedCourse?.courseCode || ''
                    };
                    
                    setSuccessStudent(studentInfo);
                    setShowSuccessModal(true);
                    setShowQRScanner(false);
                    
                    // Refresh the student list to include this student
                    fetchStudentsForSection(selectedSection._id);
                  }
                })
                .catch((error) => {
                  console.error('Failed to record attendance:', error);
                  Alert.alert(
                    "Error",
                    `Failed to record attendance: ${error.message}`,
                    [
                      { 
                        text: "Try Again", 
                        onPress: () => setScanned(false) 
                      },
                      { 
                        text: "Cancel", 
                        onPress: () => {
                          setShowQRScanner(false);
                          setScanned(false);
                        }
                      }
                    ]
                  );
                });
            } else {
              console.log('Section mismatch:');
              console.log('QR sectionId:', qrData.sectionId);
              console.log('Current sectionId:', selectedSection?._id);
              console.log('Current section course:', selectedSection?.course);
              Alert.alert(
                "Wrong Section",
                "The scanned QR code is for a different section.",
                [
                  { 
                    text: "Try Again", 
                    onPress: () => setScanned(false) 
                  },
                  { 
                    text: "Cancel", 
                    onPress: () => {
                      setShowQRScanner(false);
                      setScanned(false);
                    }
                  }
                ]
              );
            }
          } else {
            console.log('Missing sectionId in QR data and no section is currently selected');
            Alert.alert(
              "Invalid QR Code",
              "The QR code is missing section information. Please select a section first.",
              [
                { 
                  text: "Try Again", 
                  onPress: () => setScanned(false) 
                },
                { 
                  text: "Cancel", 
                  onPress: () => {
                    setShowQRScanner(false);
                    setScanned(false);
                  }
                }
              ]
            );
          }
        }
      } else {
        console.log('Missing studentId in QR data');
        Alert.alert(
          "Invalid QR Code",
          "The scanned QR code does not contain valid student information.",
          [
            { 
              text: "Try Again", 
              onPress: () => setScanned(false) 
            },
            { 
              text: "Cancel", 
              onPress: () => {
                setShowQRScanner(false);
                setScanned(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('QR code parsing error:', error);
      Alert.alert(
        "Invalid QR Code",
        "Could not process the scanned QR code.",
        [
          { 
            text: "Try Again", 
            onPress: () => setScanned(false) 
          },
          { 
            text: "Cancel", 
            onPress: () => {
              setShowQRScanner(false);
              setScanned(false);
            }
          }
        ]
      );
    }
  };
  
  // Handle scan QR button press
  const handleScanQR = () => {
    setShowQRScanner(true);
    setScanned(false);
  };

  // Add this function to handle tapping on a student to change status
  const handleChangeStatus = (student: any) => {
    setSelectedStudentForStatus(student);
    setShowStatusModal(true);
  };

  // Add this function to update a student's attendance status
  const updateAttendanceStatus = async (studentId: string, status: 'present' | 'absent' | 'excused') => {
    try {
      setProcessingAttendance(prev => ({ ...prev, [studentId]: true }));
      
      // Set the status first in the UI for immediate feedback
      setAttendanceStatuses(prev => ({ ...prev, [studentId]: status }));
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const url = `${baseUrl}/api/attendance/status`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          sectionId: selectedSection._id,
          date: new Date().toISOString(),
          status
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to mark student as ${status}`);
      }
      
      // Update the student's attendance in the UI
      const updatedStudents = students.map(student => {
        if (student._id === studentId || student.studentId === studentId) {
          // Only use the backend's calculated percentage if available
          // If not available, don't change the current attendance value
          const newAttendance = data.data?.attendancePercentage !== undefined 
            ? data.data.attendancePercentage 
            : student.attendance;
          
          console.log(`Updating attendance for student ${student._id} from ${student.attendance}% to ${newAttendance}%`);
          return { ...student, attendance: newAttendance };
        }
        return student;
      });
      
      setStudents(updatedStudents);
      
      // Show success message
      Alert.alert('Success', `Student marked as ${status}`);
      
    } catch (error) {
      console.error(`Error updating student status to ${status}:`, error);
      Alert.alert('Error', error instanceof Error ? error.message : `Failed to update student status`);
      
      // Revert the status in case of error
      setAttendanceStatuses(prev => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
    } finally {
      setProcessingAttendance(prev => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
    }
  };

  const renderSubjectsTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    // Render students list for a specific section
    if (viewMode === 'students') {
      return (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100, // Add extra padding at the bottom to prevent navbar overlap
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
              tintColor="#2563EB"
            />
          }
        >
          {/* Header with back button and Scan QR button */}
          <View style={styles.listHeader}>
            <View style={styles.headerRow}>
            <Pressable 
              style={styles.backButton} 
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color="#1D4ED8" />
              <Text style={styles.backButtonText}>Back to Sections</Text>
            </Pressable>
              
              <Pressable 
                style={styles.scanQRButton}
                onPress={handleScanQR}
              >
                <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                <Text style={styles.scanQRButtonText}>Scan QR</Text>
              </Pressable>
            </View>
            
            <Text style={styles.listTitle}>
              {selectedCourse?.courseId || selectedCourse?.courseCode} - Section {selectedSection?.sectionCode}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Student List</Text>
          
          {loadingStudents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1D4ED8" />
            </View>
          ) : students.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No students enrolled in this section</Text>
            </View>
          ) : (
            <View style={styles.studentsList}>
              {students.map((student) => (
                <Pressable 
                  key={`${student._id}-${attendanceStatuses[student._id] || 'none'}`}
                  style={styles.studentCard}
                  onPress={() => handleChangeStatus(student)}
                  disabled={processingAttendance[student._id]}
                >
                  <View style={styles.studentImageContainer}>
                    {student.idPhoto ? (
                      <Image 
                        source={{ uri: student.idPhoto.url }} 
                        style={styles.studentImage} 
                      />
                    ) : (
                      <View style={styles.studentImagePlaceholder}>
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {student.fullName || 'No Name Available'}
                    </Text>
                    <Text style={styles.studentId}>{student.studentId}</Text>
                    <Text style={styles.studentProgram}>{student.program}</Text>
                  </View>
                  <View style={styles.studentAttendance}>
                    <Text style={styles.attendanceLabel}>Attendance</Text>
                    <Text 
                      style={[
                        styles.attendanceRate, 
                        { color: (student.attendance >= 90) ? '#059669' : 
                               (student.attendance >= 80) ? '#D97706' : '#DC2626' }
                      ]}
                    >
                      {student.attendance || 0}%
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      attendanceStatuses[student._id] === 'present' ? styles.presentBadge :
                      attendanceStatuses[student._id] === 'absent' ? styles.absentBadge :
                      attendanceStatuses[student._id] === 'excused' ? styles.excusedBadge :
                      styles.noStatusBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {processingAttendance[student._id] ? '...' :
                         attendanceStatuses[student._id] === 'present' ? 'P' :
                         attendanceStatuses[student._id] === 'absent' ? 'A' : 
                         attendanceStatuses[student._id] === 'excused' ? 'E' : 
                         '-'}
                    </Text>
                  </View>
                </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      );
    }

    // Render sections for a specific course
    if (viewMode === 'sections') {
      return (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100, // Add extra padding at the bottom to prevent navbar overlap
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
              tintColor="#2563EB"
            />
          }
        >
          {/* Header with back button */}
          <View style={styles.listHeader}>
            <View style={styles.headerRow}>
            <Pressable 
              style={styles.backButton} 
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color="#1D4ED8" />
              <Text style={styles.backButtonText}>Back to Courses</Text>
            </Pressable>
            </View>
            
            <Text style={styles.listTitle}>
              {selectedCourse?.courseId || selectedCourse?.courseCode} - {selectedCourse?.courseName}
            </Text>
          </View>

          <View style={styles.courseDetailCard}>
            <Text style={styles.courseDetailTitle}>Course Details</Text>
            <View style={styles.courseDetailRow}>
              <Text style={styles.courseDetailLabel}>Course ID:</Text>
              <Text style={styles.courseDetailValue}>{selectedCourse?.courseId}</Text>
            </View>
            <View style={styles.courseDetailRow}>
              <Text style={styles.courseDetailLabel}>Type:</Text>
              <Text style={styles.courseDetailValue}>{selectedCourse?.courseType}</Text>
            </View>
            <View style={styles.courseDetailRow}>
              <Text style={styles.courseDetailLabel}>Units:</Text>
              <Text style={styles.courseDetailValue}>{selectedCourse?.units}</Text>
            </View>
            <View style={styles.courseDetailRow}>
              <Text style={styles.courseDetailLabel}>Term:</Text>
              <Text style={styles.courseDetailValue}>{selectedCourse?.term}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Sections</Text>
          
          {selectedCourse?.sections.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No sections available for this course</Text>
            </View>
          ) : (
            <View style={styles.sectionsList}>
              <Text style={styles.sectionCountText}>
                {selectedCourse?.sections.length} section{selectedCourse?.sections.length !== 1 ? 's' : ''} available
              </Text>
              {selectedCourse?.sections.map((section: any) => (
                <Pressable 
                  key={section._id} 
                  style={({pressed}) => [
                    styles.sectionCard,
                    pressed && {opacity: 0.9, transform: [{scale: 0.98}]}
                  ]}
                  onPress={() => handleSectionSelect(section)}
                >
                  <View style={styles.sectionCardContent}>
                    <View style={styles.sectionIcon}>
                      <Ionicons name="people" size={24} color="#1D4ED8" />
                    </View>
                    <View style={styles.sectionCardInfo}>
                      <Text style={styles.sectionCardTitle}>Section {section.sectionCode}</Text>
                      <Text style={styles.sectionCardSchedule}>{formatSchedule(section.schedule)}</Text>
                      <Text style={styles.sectionCardStudents}>
                        {section.enrolledStudents || 0} students enrolled
                      </Text>
                    </View>
                    <View style={styles.sectionCardArrow}>
                      <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      );
    }

    // Default view: Courses list
    return (
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100, // Add extra padding at the bottom to prevent navbar overlap
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
      >
        <View style={styles.welcomeContainer}>
          <View className="flex-row items-center mb-6">
            <Ionicons name="person-outline" size={24} color="#1D4ED8" />
            <Text className="text-xl font-bold text-gray-800 ml-2">
              Welcome, {instructorData?.fullName || userData?.name || userData?.username || "Instructor"}!
            </Text>
          </View>
          <Text style={styles.welcomeSubtitle}>
            Manage your courses and check your schedule below
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Instructor Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="id-card-outline" size={20} color="#4B5563" />
              <Text style={styles.infoText}>ID: {instructorData?.instructorId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={20} color="#4B5563" />
              <Text style={styles.infoText}>{instructorData?.program}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#4B5563" />
              <Text style={styles.infoText}>{instructorData?.faculty}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>Assigned Courses</Text>
          {assignedCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No courses assigned yet</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal={false} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.coursesList}
            >
              {assignedCourses.map((course) => (
                <Pressable 
                  key={course._id} 
                  style={({pressed}) => [
                    styles.courseCard,
                    pressed && {opacity: 0.9, transform: [{scale: 0.98}]}
                  ]}
                  onPress={() => handleCourseSelect(course)}
                >
                  <View style={styles.courseHeader}>
                    <View style={styles.courseIcon}>
                      <Ionicons name="book" size={24} color="#1D4ED8" />
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseCode}>{course.courseId}</Text>
                      <Text style={styles.courseName}>{course.courseName}</Text>
                      <Text style={styles.courseDetails}>
                        {course.courseType} • {course.units} units • Term {course.term}
                      </Text>
                      {course.sections && course.sections.length > 1 && (
                        <View style={styles.sectionBadge}>
                          <Text style={styles.sectionBadgeText}>
                            {course.sections.length} sections
                      </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.courseArrow}>
                      <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    );
  };

  // Add these state variables inside the InstructorDashboard component
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editableProfile, setEditableProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Start editing profile
  const startEditingProfile = () => {
    setEditableProfile({
      firstName: instructorData?.firstName || '',
      middleName: instructorData?.middleName || '',
      lastName: instructorData?.lastName || '',
      gmail: instructorData?.gmail || ''
    });
    setIsEditingProfile(true);
  };

  // Save profile changes
  const saveProfileChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const url = `${baseUrl}/api/instructors/update-profile`;
      
      console.log('Updating profile with data:', editableProfile);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableProfile),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update the local instructor data with the updated values
      setInstructorData({
        ...instructorData,
        ...editableProfile,
      });

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  // Cancel profile editing
  const cancelProfileEditing = () => {
    setIsEditingProfile(false);
    setEditableProfile(null);
  };

  // Add pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('Pull-to-refresh triggered in', activeTab, 'tab, view mode:', viewMode);
    
    try {
      if (activeTab === 'profile') {
        // Refresh instructor data
        await fetchInstructorData();
      } else if (activeTab === 'subjects') {
        if (viewMode === 'courses') {
          // Refresh instructor data and assigned courses
          await fetchInstructorData();
        } else if (viewMode === 'sections' && selectedCourse) {
          // Refresh selected course sections
          const token = await AsyncStorage.getItem('token');
          if (token) {
            const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
            await fetchAssignedCourses(token, baseUrl);
          }
        } else if (viewMode === 'students' && selectedSection) {
          // Refresh students list for the selected section
          await fetchStudentsForSection(selectedSection._id);
          // Also refresh today's attendance records
          if (selectedSection._id) {
            await fetchTodayAttendance(selectedSection._id);
          }
        }
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, viewMode, selectedCourse, selectedSection]);

  const renderProfileTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (isEditingProfile) {
      return (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100, // Add extra padding at the bottom to prevent navbar overlap
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
              tintColor="#2563EB"
            />
          }
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: instructorData?.idPhoto?.url || 'https://via.placeholder.com/100' }}
                style={styles.profileImage}
              />
            </View>
            <Text style={styles.profileName}>{instructorData?.fullName}</Text>
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Edit Profile Information</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editableProfile.firstName}
                  onChangeText={(text) => setEditableProfile({...editableProfile, firstName: text})}
                  placeholder="First Name"
                />
              </View>
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>Middle Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editableProfile.middleName}
                  onChangeText={(text) => setEditableProfile({...editableProfile, middleName: text})}
                  placeholder="Middle Name (Optional)"
                />
              </View>
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editableProfile.lastName}
                  onChangeText={(text) => setEditableProfile({...editableProfile, lastName: text})}
                  placeholder="Last Name"
                />
              </View>
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={editableProfile.gmail}
                  onChangeText={(text) => setEditableProfile({...editableProfile, gmail: text})}
                  placeholder="Email Address"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.buttonsContainer}>
                <Pressable 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={cancelProfileEditing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={saveProfileChanges}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100, // Add extra padding at the bottom to prevent navbar overlap
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: instructorData?.idPhoto?.url || 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.profileName}>{instructorData?.fullName}</Text>
          <Pressable 
            style={styles.editButton}
            onPress={startEditingProfile}
          >
            <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Instructor ID</Text>
              <Text style={styles.fieldValue}>{instructorData?.instructorId}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <Text style={styles.fieldValue}>{instructorData?.firstName}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Middle Name</Text>
              <Text style={styles.fieldValue}>{instructorData?.middleName || 'N/A'}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <Text style={styles.fieldValue}>{instructorData?.lastName}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Program</Text>
              <Text style={styles.fieldValue}>{instructorData?.program}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Faculty</Text>
              <Text style={styles.fieldValue}>{instructorData?.faculty}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{instructorData?.gmail || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Add this useEffect to check status indicators whenever students list changes
  useEffect(() => {
    // Skip the first render and only run when there are actually students
    if (students.length === 0 || !viewMode || viewMode !== 'students' || !selectedSection?._id) {
      return;
    }

    // Use a ref to track if we already ran this effect for this specific students array
    // to prevent multiple consecutive calls to fetchTodayAttendance
    const runOnce = () => {
      console.log('Student list changed, checking status indicators...');
      
      // Check if any students are missing status indicators
      const studentsWithoutStatus = students.filter(
        student => !attendanceStatuses[student._id]
      );
      
      if (studentsWithoutStatus.length > 0) {
        console.log(`Found ${studentsWithoutStatus.length} students without status indicators, updating from backend...`);
        // Fetch today's attendance to update status indicators for these students
        fetchTodayAttendance(selectedSection._id);
      } else {
        console.log('All students have status indicators');
      }
    };

    // Only run once when the students array changes
    const timeoutId = setTimeout(runOnce, 300);
    
    // Clean up timeout to prevent memory leaks
    return () => clearTimeout(timeoutId);
    
    // IMPORTANT: Remove attendanceStatuses from the dependency array to prevent infinite loop
    // since fetchTodayAttendance updates attendanceStatuses which would trigger this effect again
  }, [students, selectedSection?._id, viewMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <SafeAreaView style={styles.qrScannerContainer}>
          <View style={styles.qrScannerHeader}>
            <Text style={styles.qrScannerTitle}>Scan Student QR Code</Text>
            <Pressable 
              style={styles.qrScannerCloseButton}
              onPress={() => setShowQRScanner(false)}
            >
              <Ionicons name="close" size={24} color="#4B5563" />
            </Pressable>
          </View>
          
          <QRScannerComponent 
            onScan={handleBarCodeScanned}
            scanned={scanned}
            setScanned={setScanned}
            hasPermission={hasPermission}
            styles={styles}
          />
        </SafeAreaView>
      </Modal>
      
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successHeader}>
              <View style={styles.successHeaderBadge}>
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.successHeaderTitle}>Student is Present</Text>
            </View>
            
            <View style={styles.successStudentContainer}>
              <View style={styles.successStudentImageContainer}>
                {successStudent?.idPhoto ? (
                  <Image 
                    source={{ uri: successStudent.idPhoto.url }} 
                    style={styles.successStudentImage} 
                  />
                ) : (
                  <View style={styles.successStudentImagePlaceholder}>
                    <Ionicons name="person" size={48} color="#9CA3AF" />
                  </View>
                )}
              </View>
              
              <View style={styles.successStudentDetails}>
                <Text style={styles.successStudentName}>
                  {successStudent?.fullName || 'Student Name'}
                </Text>
                <Text style={styles.successStudentId}>
                  ID: {successStudent?.studentId || 'Unknown'}
                </Text>
                <Text style={styles.successStudentSection}>
                  {successStudent?.course || ''} - Section {successStudent?.section || ''}
                </Text>
              </View>
            </View>
            
            <View style={styles.successTimestamp}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.successTimestampText}>
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
            
            <Pressable 
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                setScanned(false);
              }}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      
      {/* Status Change Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Attendance Status</Text>
            <Text style={styles.modalSubtitle}>
              {selectedStudentForStatus?.fullName || 'Student'}
            </Text>
            
            <Pressable 
              style={[styles.statusButton, styles.absentButton]}
              onPress={() => {
                updateAttendanceStatus(selectedStudentForStatus?._id, 'absent');
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.statusButtonText}>Absent (A)</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.statusButton, styles.excusedButton]}
              onPress={() => {
                updateAttendanceStatus(selectedStudentForStatus?._id, 'excused');
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.statusButtonText}>Excused (E)</Text>
            </Pressable>
            
            <Pressable 
              style={styles.cancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS !== "web" ? insets.top || 12 : 12 }}
        className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-200"
      >
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-blue-700">ATS</Text>
          {!isMobile && (
            <Text className="text-base text-gray-700 ml-2">
              | Instructor Dashboard
            </Text>
          )}
        </View>
        <Pressable 
          className="flex-row items-center space-x-2 px-3 py-1.5 rounded-full border border-gray-200"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={16} color="#4B5563" />
          <Text className="text-gray-700 text-sm">Logout</Text>
        </Pressable>
      </View>
      
      {/* Content */}
      {activeTab === 'subjects' ? renderSubjectsTab() : renderProfileTab()}

      {/* Bottom Navigation Bar */}
      <View 
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS !== "web" ? insets.bottom || 12 : 12 }
        ]}
        className="flex-row border-t border-gray-200 bg-white"
      >
        <Pressable
          style={[styles.navItem, activeTab === 'subjects' && styles.activeNavItem]}
          onPress={() => {
            setActiveTab('subjects');
            // Reset the view mode to courses if coming from profile tab
            if (activeTab !== 'subjects') {
              setViewMode('courses');
              setSelectedCourse(null);
              setSelectedSection(null);
            }
          }}
        >
          <Ionicons
            name="book-outline"
            size={24}
            color={activeTab === 'subjects' ? '#1D4ED8' : '#4B5563'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'subjects' && styles.activeNavText,
            ]}
          >
            Subjects
          </Text>
        </Pressable>
        <Pressable
          style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={activeTab === 'profile' ? '#1D4ED8' : '#4B5563'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'profile' && styles.activeNavText,
            ]}
          >
            Profile
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Add extra padding at the bottom to account for the navigation bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: 300,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#1D4ED8',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  profileField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFFFFF',
    zIndex: 1000, // Ensure the navbar appears above content
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#1D4ED8',
  },
  navText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },
  activeNavText: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  logoutText: {
    color: '#DC2626',
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  coursesSection: {
    marginBottom: 24,
  },
  coursesList: {
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  courseName: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  courseDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  courseArrow: {
    marginLeft: 8,
  },
  courseSectionCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseSectionCountText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  sectionInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionCode: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#4B5563',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // New styles for sections list view
  listHeader: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#1D4ED8',
    marginLeft: 4,
    fontWeight: '500',
  },
  scanQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scanQRButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  courseDetailCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  courseDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  courseDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  courseDetailLabel: {
    width: 100,
    fontSize: 14,
    color: '#6B7280',
  },
  courseDetailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  sectionsList: {
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionCardInfo: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sectionCardSchedule: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  sectionCardStudents: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionCardArrow: {
    paddingLeft: 8,
  },
  
  // New styles for students list view
  studentsList: {
    marginBottom: 24,
  },
  studentCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  studentImage: {
    width: '100%',
    height: '100%',
  },
  studentImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
  },
  studentProgram: {
    fontSize: 12,
    color: '#6B7280',
  },
  studentAttendance: {
    alignItems: 'center',
    paddingLeft: 4,
    minWidth: 70,
  },
  attendanceLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  attendanceRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  
  // New styles for QR scanner
  qrScannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  qrScannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  qrScannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  qrScannerCloseButton: {
    padding: 8,
  },
  qrScannerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  qrScannerCameraContainer: {
    flex: 1,
    position: 'relative',
  },
  qrScannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrScannerTargetBox: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 16,
    position: 'relative',
  },
  qrCornerTL: {
    width: 20,
    height: 20,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#FFFFFF',
    position: 'absolute',
    top: -2,
    left: -2,
  },
  qrCornerTR: {
    width: 20,
    height: 20,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#FFFFFF',
    position: 'absolute',
    top: -2,
    right: -2,
  },
  qrCornerBL: {
    width: 20,
    height: 20,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: -2,
    left: -2,
  },
  qrCornerBR: {
    width: 20,
    height: 20,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  qrRescanButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  qrRescanButton: {
    padding: 16,
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  qrRescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  qrScannerOverlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  qrScannerOverlaySubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrScannerHintContainer: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 12,
  },
  qrScannerHintIcon: {
    marginBottom: 8,
  },
  qrScannerHint: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // Success modal styles
  successModalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successHeaderBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669', // Green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669', // Match badge color
  },
  successStudentContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  successStudentImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  successStudentImage: {
    width: '100%',
    height: '100%',
  },
  successStudentImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successStudentDetails: {
    flex: 1,
  },
  successStudentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  successStudentId: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  successStudentSection: {
    fontSize: 14,
    color: '#6B7280',
  },
  successTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  successTimestampText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  successButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Additional styles for web fallback
  qrScannerWebFallback: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  qrScannerWebInstructions: {
    marginVertical: 16,
    textAlign: 'center',
    color: '#4B5563',
  },
  qrScannerTextInput: {
    width: '100%',
    maxWidth: 500,
    height: 100,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  sectionBadge: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionCountText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  attendanceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#EF4444', // Red background
    marginTop: 4,
    width: '100%',
  },
  attendanceActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  absentButton: {
    backgroundColor: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
  },
  statusButton: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  presentButton: {
    backgroundColor: '#059669',
  },
  excusedButton: {
    backgroundColor: '#D97706',
  },
  noStatusBadge: {
    backgroundColor: '#9CA3AF',
  },
  presentBadge: {
    backgroundColor: '#059669',
  },
  absentBadge: {
    backgroundColor: '#DC2626',
  },
  excusedBadge: {
    backgroundColor: '#D97706',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1D4ED8',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 