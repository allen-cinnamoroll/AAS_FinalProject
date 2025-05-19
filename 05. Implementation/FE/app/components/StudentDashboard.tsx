import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { authService } from '../services/authService';

interface StudentDashboardProps {
  userData: any;
  onLogout: () => void;
}

export default function StudentDashboard({ userData, onLogout }: StudentDashboardProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('myqr');
  const [studentData, setStudentData] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  // Keep track of whether we're currently selecting an enrollment
  const [isChangingEnrollment, setIsChangingEnrollment] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editableProfile, setEditableProfile] = useState<any>(null);
  const [deletingAttendance, setDeletingAttendance] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);
  const isMobile = Platform.OS !== 'web';
  
  // Add refs to track initial mount and prevent infinite loops
  const initialMount = useRef(true);
  const attendanceTabSelected = useRef(false);
  const enrollmentsLoaded = useRef(false);

  useEffect(() => {
    fetchStudentData();
  }, []);
  
  useEffect(() => {
    // Fetch attendance when tab changes to 'attendance'
    if (activeTab === 'attendance') {
      if (!attendanceTabSelected.current) {
        attendanceTabSelected.current = true;
      }
      
      // Only fetch if not already loading
      if (!loadingAttendance) {
        console.log('Tab changed to attendance - fetching all attendance records');
        
        // Clear attendance records before fetching to prevent old data from showing
        setAttendanceRecords([]);
        fetchAttendanceRecords();
      } else {
        console.log('Skipping auto-fetch: loadingAttendance=', loadingAttendance);
      }
    }
  }, [activeTab]);

  // Remove the problematic useEffect that was causing the infinite update loop
  // This effect was redundant with the one above that already handles
  // fetching attendance when needed
  
  // Create QR code data 
  const [qrDataObj, setQrDataObj] = useState({
    studentId: studentData?.studentId || studentData?._id || userData?.id || '',
    name: studentData?.fullName || userData?.name || '',
    enrollmentId: selectedEnrollment?._id || '',
    sectionId: selectedEnrollment?.assignedCourse?._id || '',
    timestamp: new Date().toISOString()
  });
  
  // Convert to JSON string for QR code
  const qrData = JSON.stringify(qrDataObj);

  // Update QR data when student data or enrollment changes
  useEffect(() => {
    if (studentData || selectedEnrollment || userData) {
      setQrDataObj({
        studentId: studentData?.studentId || studentData?._id || userData?.id || '',
        name: studentData?.fullName || userData?.name || '',
        enrollmentId: selectedEnrollment?._id || '',
        sectionId: selectedEnrollment?.assignedCourse?._id || '',
        timestamp: new Date().toISOString()
      });
    }
  }, [studentData, selectedEnrollment, userData]);

  // Fix QR debug effect to prevent unnecessary updates
  useEffect(() => {
    // Use a ref to ensure this only runs when qrData changes meaningfully
    // not on every render
    if (qrData && qrData.includes(selectedEnrollment?._id || '')) {
      const debugToken = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            console.log('Current token (first 20 chars):', token.substring(0, 20) + '...');
            
            // Only try to decode if we have a valid token
            if (token.split('.').length === 3) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('Token payload:', payload);
              } catch (err) {
                console.log('Could not decode token for debugging:', err);
              }
            }
          } else {
            console.log('No token found in AsyncStorage');
          }
        } catch (error) {
          console.error('Error reading token:', error);
        }
      };
      
      debugToken();
    }
  }, [qrData]);

  const fetchStudentData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get user data from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        throw new Error('No user data found');
      }

      const userData = JSON.parse(userDataString);
      console.log('User data:', userData);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const url = `${baseUrl}/api/students/${userData.id}`;
      
      console.log('Fetching student data from:', url);
      console.log('Using token:', token.substring(0, 10) + '...');

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
        throw new Error(data.message || 'Failed to fetch student data');
      }

      // Construct full image URL
      if (data.data.idPhoto) {
        data.data.idPhoto.url = `${baseUrl}/${data.data.idPhoto.url}`;
      }

      setStudentData(data.data);
      
      // Fetch student's enrollments
      try {
        // Make sure token format is correct
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        const enrollmentsResponse = await fetch(`${baseUrl}/api/enrollments/my-enrollments`, {
          method: 'GET',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Enrollments response status:', enrollmentsResponse.status);
        
        // Parse response as text first for debugging
        const responseText = await enrollmentsResponse.text();
        console.log('Raw enrollments response:', responseText.substring(0, 200) + '...');
        
        let enrollmentsData;
        try {
          enrollmentsData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing enrollments response:', parseError);
          throw new Error('Invalid JSON in enrollments response');
        }
        
        console.log('Student enrollments data:', enrollmentsData);
        
        if (enrollmentsResponse.ok && enrollmentsData.success && enrollmentsData.data) {
          // Validate and fix enrollments data before setting state
          const processedEnrollments = enrollmentsData.data.map((enrollment: any) => {
            // Ensure assignedCourse exists
            if (!enrollment.assignedCourse) {
              console.warn(`Enrollment ${enrollment._id} missing assignedCourse`);
              enrollment.assignedCourse = { section: 'Unknown' };
            }
            
            // Ensure course exists in assignedCourse
            if (!enrollment.assignedCourse.course) {
              console.warn(`Enrollment ${enrollment._id} missing course data`);
              enrollment.assignedCourse.course = { 
                courseCode: 'ITC-Default', 
                courseName: 'Unknown Course' 
              };
            } else if (!enrollment.assignedCourse.course.courseCode) {
              // Fix missing courseCode by using courseId
              console.log(`Setting missing courseCode for ${enrollment._id}`);
              enrollment.assignedCourse.course.courseCode = 
                enrollment.assignedCourse.course.courseId || 'ITC-Default';
            }
            
            // Ensure instructor exists in assignedCourse
            if (!enrollment.assignedCourse.instructor) {
              console.warn(`Enrollment ${enrollment._id} missing instructor data`);
              enrollment.assignedCourse.instructor = { fullName: 'Unknown Instructor' };
            }
            
            return enrollment;
          });
          
          setEnrollments(processedEnrollments);
          
          // Set the first enrollment as selected by default
          if (processedEnrollments.length > 0) {
            setSelectedEnrollment(processedEnrollments[0]);
            console.log('Selected enrollment:', processedEnrollments[0]);
          }
        } else {
          console.log('No enrollments found for student');
          setEnrollments([]);
        }
      } catch (error) {
        console.error('Error fetching student enrollments:', error);
        // Use mock enrollments for testing if API fails
        const mockEnrollments = [
          {
            _id: '1',
            student: data.data._id,
            assignedCourse: {
              _id: 'ac1',
              course: { 
                _id: 'c1', 
                courseCode: 'CS101', 
                courseName: 'Introduction to Computer Science'
              },
              section: 'A',
              instructor: { 
                _id: 'i1', 
                fullName: 'Dr. John Smith' 
              }
            }
          }
        ];
        console.log('Using mock enrollment data:', mockEnrollments);
        setEnrollments(mockEnrollments);
        if (mockEnrollments.length > 0) {
          setSelectedEnrollment(mockEnrollments[0]);
        }
      }

      setError(null);
    } catch (error: unknown) {
      console.error('Error fetching student data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student's attendance records
  const fetchAttendanceRecords = async () => {
    try {
      setLoadingAttendance(true);
      // Clear attendance records first to prevent showing stale data
      setAttendanceRecords([]);
      
      console.log('==========================================');
      console.log('Starting to fetch attendance records...');
      console.log('Current selected enrollment:', selectedEnrollment ? 
        `${selectedEnrollment._id} (${selectedEnrollment.assignedCourse?.course?.courseCode} - ${selectedEnrollment.assignedCourse?.section})` : 'none');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('Using token (first 10 chars):', token.substring(0, 10) + '...');

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      let url = `${baseUrl}/api/attendance/my-attendance`;
      
      console.log('Fetching attendance for all courses');
      
      console.log('Fetching attendance records from:', url);

      // Get user data for debugging
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('Current user data:', { 
          id: userData.id,
          role: userData.role || 'unknown',
          name: userData.name || 'unknown'
        });
      }

      // Make sure token format is correct for the API request
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Print enrollment information for debugging
      console.log(`Current enrollments: ${enrollments.length}`);
      enrollments.forEach((enrollment, index) => {
        console.log(`Enrollment ${index + 1}:`, {
          id: enrollment._id,
          course: enrollment.assignedCourse?.course?.courseCode || 'unknown',
          section: enrollment.assignedCourse?.section || 'unknown'
        });
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
      });

      console.log('Attendance response status:', response.status);
      
      // Check status code before proceeding
      if (!response.ok) {
        console.error('Error response from server:', response.status, response.statusText);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Log raw response for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 200) + '...');
      
      // Parse the JSON response
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Attendance data parsed successfully');
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse attendance records response');
      }
      
      console.log('Attendance data received:', { 
        success: data.success, 
        count: data.count || 0, 
        hasData: !!data.data
      });
      
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log(`Processing ${data.data.length} attendance records`);
        // Process the records to ensure they have proper display formats
        const processedRecords = data.data.map((record: any, index: number) => {
          console.log(`Processing record ${index + 1}:`, {
            id: record._id,
            date: record.date,
            status: record.status,
            hasSectionData: !!record.section,
            hasEnrollmentData: !!record.enrollment
          });
          
          // Ensure date and createdAt are Date objects
          if (record.date && typeof record.date === 'string') {
            record.date = new Date(record.date);
          }
          if (record.createdAt && typeof record.createdAt === 'string') {
            record.createdAt = new Date(record.createdAt);
          }
          
          // Ensure course code is available
          if (record.section && record.section.course) {
            if (!record.section.course.courseCode) {
              console.log(`Setting missing courseCode for record ${index + 1}`);
              record.section.course.courseCode = 
                record.section.course.courseId || 'ITC-Default';
            }
            
            if (!record.section.course.courseName) {
              console.log(`Setting missing courseName for record ${index + 1}`);
              record.section.course.courseName = 
                record.section.course.description || 'Unknown Course';
            }
            
            // Fix missing section data if we have an enrollment
            if ((!record.section.section || record.section.section === 'Unknown') && 
                record.enrollment?.assignedCourse?.section) {
              console.log(`Setting missing section from enrollment for record ${index + 1}`);
              record.section.section = record.enrollment.assignedCourse.section;
            }
            
            // Log section data to debug "Unknown" section issue
            console.log(`Record ${index + 1} section data:`, {
              sectionId: record.section._id,
              sectionValue: record.section.section,
              hasAssignedCourse: !!record.enrollment?.assignedCourse,
              assignedCourseSection: record.enrollment?.assignedCourse?.section || 'none'
            });
          }
          
          // If we're still missing course info, try to use enrollment data
          if ((!record.section || !record.section.course) && enrollments.length > 0) {
            console.log(`Record ${index + 1} missing course info, attempting to fill from enrollments`);
            // Try to find matching enrollment by section ID
            let matchingEnrollment;
            if (record.section && record.section._id) {
              console.log(`Looking for enrollment with section ID: ${record.section._id}`);
              matchingEnrollment = enrollments.find(e => 
                e.assignedCourse._id === record.section._id
              );
            }
            
            // If not found, try matching by sectionId
            if (!matchingEnrollment && record.sectionId) {
              console.log(`Looking for enrollment with sectionId: ${record.sectionId}`);
              matchingEnrollment = enrollments.find(e => 
                e.assignedCourse._id === record.sectionId
              );
            }
            
            // If not found and record has enrollment data, try to match by that
            if (!matchingEnrollment && record.enrollment) {
              console.log(`Looking for enrollment matching record.enrollment: ${record.enrollment._id}`);
              if (record.enrollment.assignedCourse) {
                matchingEnrollment = enrollments.find(e => 
                  e._id === record.enrollment._id || 
                  e.assignedCourse._id === record.enrollment.assignedCourse._id
                );
              }
            }
            
            // If found, use course info from enrollment
            if (matchingEnrollment) {
              console.log(`Found matching enrollment for record ${index + 1}:`, {
                id: matchingEnrollment._id,
                course: matchingEnrollment.assignedCourse?.course?.courseCode || 'unknown'
              });
              
              if (!record.section) {
                record.section = {
                  _id: matchingEnrollment.assignedCourse._id,
                  section: matchingEnrollment.assignedCourse.section
                };
              }
              
              record.section.course = {
                _id: matchingEnrollment.assignedCourse.course._id,
                courseCode: matchingEnrollment.assignedCourse.course.courseCode,
                courseName: matchingEnrollment.assignedCourse.course.courseName
              };
            } else {
              console.log(`No matching enrollment found for record ${index + 1}`);
            }
          }
          
          return record;
        });
        
        // Sort by date (newest first)
        const sortedRecords = [...processedRecords].sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        console.log(`Setting ${sortedRecords.length} processed attendance records`);
        
        // Slight delay to ensure UI updates smoothly
        setTimeout(() => {
          setAttendanceRecords(sortedRecords);
          setLoadingAttendance(false);
          console.log('Attendance records updated in state');
          console.log('==========================================');
        }, 50);
        return;
      } else {
        console.log('No valid attendance data in response');
        // If we have enrollments but no attendance records from API
        if (enrollments.length > 0 && (!data.data || data.data.length === 0)) {
          console.log('User has enrollments but no attendance records');
          
          // Slight delay for smooth UI updates
          setTimeout(() => {
            setAttendanceRecords([]);
            setLoadingAttendance(false);
            console.log('Set empty attendance records');
            console.log('==========================================');
          }, 50);
          return;
        } else {
          // Fallback to mock data in case of API issues
          console.warn('API returned no data, using mock attendance records.');
          // ... mock attendance code remains the same ...
        }
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setTimeout(() => {
        setAttendanceRecords([]);
        setLoadingAttendance(false);
        console.log('Error case: Set empty attendance records');
        console.log('==========================================');
      }, 50);
      return;
    }
    
    // Final fallback if we somehow reached here
    setLoadingAttendance(false);
    console.log('Fallback path: Attendance loading complete');
    console.log('==========================================');
  };

  // Function to handle enrollment selection change (only used for QR code generation)
  const handleEnrollmentChange = (enrollmentId: string) => {
    const enrollment = enrollments.find(e => e._id === enrollmentId);
    if (enrollment) {
      // Update selected enrollment for QR code
      setSelectedEnrollment(enrollment);
      console.log('Selected enrollment changed to:', 
        `${enrollment._id} (${enrollment.assignedCourse?.course?.courseCode} - ${enrollment.assignedCourse?.section})`);
    }
  };

  const handleLogout = async () => {
    try {
      // Call the backend logout endpoint first
      await authService.logout();
      
      // Then clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      
      // Finally, call the parent's onLogout for UI updates
      onLogout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local storage and update UI even if backend call fails
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      onLogout();
    }
  };

  const handleRefreshAttendance = () => {
    if (!loadingAttendance) {
      console.log('Manually refreshing attendance records');
      fetchAttendanceRecords();
    }
  };

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
        <ScrollView style={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: studentData?.idPhoto?.url || 'https://via.placeholder.com/100' }}
                style={styles.profileImage}
              />
            </View>
            <Text style={styles.profileName}>{studentData?.fullName}</Text>
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
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: studentData?.idPhoto?.url || 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.profileName}>{studentData?.fullName}</Text>
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
              <Text style={styles.fieldLabel}>Student ID</Text>
              <Text style={styles.fieldValue}>{studentData?.studentId}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <Text style={styles.fieldValue}>{studentData?.firstName}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Middle Name</Text>
              <Text style={styles.fieldValue}>{studentData?.middleName || 'N/A'}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <Text style={styles.fieldValue}>{studentData?.lastName}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Year Level</Text>
              <Text style={styles.fieldValue}>{studentData?.yearLevel}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Program</Text>
              <Text style={styles.fieldValue}>{studentData?.program}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Faculty</Text>
              <Text style={styles.fieldValue}>{studentData?.faculty}</Text>
            </View>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{studentData?.gmail}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Pull-to-refresh functionality
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    if (activeTab === 'attendance') {
      console.log('Pull-to-refresh: refreshing attendance records');
      fetchAttendanceRecords().finally(() => setRefreshing(false));
    } else if (activeTab === 'profile') {
      console.log('Pull-to-refresh: refreshing student data');
      fetchStudentData().finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [activeTab]);

  // Start editing profile
  const startEditingProfile = () => {
    setEditableProfile({
      firstName: studentData?.firstName || '',
      middleName: studentData?.middleName || '',
      lastName: studentData?.lastName || '',
      gmail: studentData?.gmail || ''
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
      const url = `${baseUrl}/api/students/update-profile`;
      
      console.log('Updating profile with data:', editableProfile);
      
      // Make sure token format is correct
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableProfile),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to update profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update the local student data with the updated values
      setStudentData({
        ...studentData,
        ...editableProfile,
      });

      // Show success modal instead of alert
      setIsEditingProfile(false);
      setShowProfileUpdateModal(true);
      
      // Automatically hide the modal after 3 seconds
      setTimeout(() => {
        setShowProfileUpdateModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Show different alerts based on platform
      if (Platform.OS === 'web') {
        alert(error instanceof Error ? error.message : 'Failed to update profile');
      } else {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
      }
    }
  };

  // Cancel profile editing
  const cancelProfileEditing = () => {
    setIsEditingProfile(false);
    setEditableProfile(null);
  };

  // Function to delete an attendance record
  const deleteAttendanceRecord = async (attendanceId: string) => {
    try {
      setDeletingAttendance(true);
      console.log('Deleting attendance record:', attendanceId);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.229.162:8000';
      const url = `${baseUrl}/api/attendance/delete/${attendanceId}`;
      console.log('Sending delete request to:', url);

      // Make sure token format is correct for the API request
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
        }
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        throw new Error(errorData.message || 'Failed to delete attendance record');
      }
      
      const data = await response.json();
      console.log('Delete response:', data);
      
      if (data.success) {
        // Remove the deleted record from state
        setAttendanceRecords(prev => prev.filter(record => record._id !== attendanceId));
        Alert.alert('Success', 'Attendance record deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete attendance record');
      }
      
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete attendance record';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeletingAttendance(false);
    }
  };

  // Function to confirm deletion before proceeding
  const confirmDeletion = (attendanceId: string) => {
    Alert.alert(
      'Delete Attendance Record',
      'Are you sure you want to delete this attendance record? This action cannot be undone.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel'
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteAttendanceRecord(attendanceId)
        }
      ]
    );
  };

  // Function to close the attendance details modal
  const closeAttendanceModal = () => {
    setShowAttendanceModal(false);
    setSelectedAttendance(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Profile Update Success Modal */}
      <Modal
        visible={showProfileUpdateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#059669" />
            </View>
            <Text style={styles.successModalTitle}>Profile Updated!</Text>
            <Text style={styles.successModalMessage}>
              Your profile information has been successfully updated.
            </Text>
            <Pressable 
              style={styles.successModalButton}
              onPress={() => setShowProfileUpdateModal(false)}
            >
              <Text style={styles.successModalButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      
      {/* Attendance Details Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAttendanceModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.attendanceModalContent}>
            <View style={styles.attendanceModalHeader}>
              <View style={styles.attendanceModalHeaderIcon}>
                {selectedAttendance?.status === 'present' ? (
                  <Ionicons name="checkmark-circle" size={28} color="#059669" />
                ) : selectedAttendance?.status === 'absent' ? (
                  <Ionicons name="close-circle" size={28} color="#DC2626" />
                ) : selectedAttendance?.status === 'excused' ? (
                  <Ionicons name="alert-circle" size={28} color="#D97706" />
                ) : (
                  <Ionicons name="help-circle" size={28} color="#6B7280" />
                )}
              </View>
              <Text style={styles.attendanceModalTitle}>
                Attendance Details
              </Text>
              <Pressable
                style={styles.attendanceModalCloseButton}
                onPress={closeAttendanceModal}
              >
                <Ionicons name="close" size={24} color="#4B5563" />
              </Pressable>
            </View>
            
            <View style={styles.attendanceStatusBadge}>
              <Text style={[
                styles.attendanceStatusText,
                selectedAttendance?.status === 'present' ? styles.presentText :
                selectedAttendance?.status === 'absent' ? styles.absentText :
                selectedAttendance?.status === 'excused' ? styles.excusedText :
                styles.unknownText
              ]}>
                {selectedAttendance?.status === 'present' ? 'Present' : 
                 selectedAttendance?.status === 'absent' ? 'Absent' : 
                 selectedAttendance?.status === 'excused' ? 'Excused' : 
                 selectedAttendance?.status || 'Unknown Status'}
              </Text>
            </View>
            
            <View style={styles.attendanceModalBody}>
              <View style={styles.attendanceDetailRow}>
                <View style={styles.attendanceDetailIconContainer}>
                  <Ionicons name="book-outline" size={20} color="#3B82F6" />
                </View>
                <View style={styles.attendanceDetailTextContainer}>
                  <Text style={styles.attendanceDetailLabel}>Course</Text>
                  <Text style={styles.attendanceDetailValue}>
                    {selectedAttendance?.section?.course?.courseCode || selectedAttendance?.section?.course?.courseId || 'Unknown'} - {selectedAttendance?.section?.course?.courseName || 'Unknown Course'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.attendanceDetailRow}>
                <View style={styles.attendanceDetailIconContainer}>
                  <Ionicons name="people-outline" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.attendanceDetailTextContainer}>
                  <Text style={styles.attendanceDetailLabel}>Section</Text>
                  <Text style={styles.attendanceDetailValue}>
                    {selectedAttendance?.section?.section || 
                     selectedAttendance?.enrollment?.assignedCourse?.section || 
                     'Unknown'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.attendanceDetailRow}>
                <View style={styles.attendanceDetailIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#EC4899" />
                </View>
                <View style={styles.attendanceDetailTextContainer}>
                  <Text style={styles.attendanceDetailLabel}>Date</Text>
                  <Text style={styles.attendanceDetailValue}>
                    {selectedAttendance?.date ? new Date(selectedAttendance.date).toLocaleDateString([], {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown Date'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.attendanceDetailRow}>
                <View style={styles.attendanceDetailIconContainer}>
                  <Ionicons name="time-outline" size={20} color="#0891B2" />
                </View>
                <View style={styles.attendanceDetailTextContainer}>
                  <Text style={styles.attendanceDetailLabel}>Time</Text>
                  <Text style={styles.attendanceDetailValue}>
                    {selectedAttendance?.createdAt || selectedAttendance?.date ? 
                      new Date(selectedAttendance?.createdAt || selectedAttendance?.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Unknown Time'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.attendanceModalFooter}>
              <Pressable 
                style={styles.attendanceModalCloseBtn}
                onPress={closeAttendanceModal}
              >
                <Text style={styles.attendanceModalCloseBtnText}>Close</Text>
              </Pressable>
              
              {selectedAttendance?._id && (
                <Pressable 
                  style={styles.attendanceModalDeleteBtn}
                  onPress={() => {
                    closeAttendanceModal();
                    // Small delay to ensure modal is closed before showing alert
                    setTimeout(() => {
                      confirmDeletion(selectedAttendance._id);
                    }, 300);
                  }}
                  disabled={deletingAttendance}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFFFFF" style={{marginRight: 4}} />
                  <Text style={styles.attendanceModalDeleteBtnText}>Delete</Text>
                </Pressable>
              )}
            </View>
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
          <Text className="text-base text-gray-700 ml-2">
            | Student Dashboard
          </Text>
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
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1D4ED8"]}
            tintColor="#1D4ED8"
          />
        }
      >
        {activeTab === 'myqr' && (
          <View className="px-4 py-6">
            <View className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="person-outline" size={24} color="#1D4ED8" />
                <Text className="text-xl font-bold text-gray-800 ml-2">
                  Welcome, {studentData?.fullName || userData?.name || userData?.username || "Student"}!
                </Text>
              </View>
              <Text className="text-gray-600 mb-2">
                Use your QR code for quick attendance check-in. Show it to your instructor when requested.
              </Text>
            </View>
            
            <View className="bg-white rounded-lg shadow-sm p-6">
              <Text className="text-xl font-bold text-gray-800 mb-4">My QR Code</Text>
              
              {/* Enrollment selection */}
              {enrollments.length > 0 ? (
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2">Select class for attendance:</Text>
                  <View className="bg-gray-100 rounded-lg p-1">
                    {enrollments.map((enrollment) => (
                      <Pressable
                        key={enrollment._id}
                        onPress={() => handleEnrollmentChange(enrollment._id)}
                        className={`p-3 rounded-md mb-1 ${
                          selectedEnrollment?._id === enrollment._id 
                            ? 'bg-blue-500' 
                            : 'bg-white'
                        }`}
                      >
                        <Text 
                          className={`font-medium ${
                            selectedEnrollment?._id === enrollment._id 
                              ? 'text-white' 
                              : 'text-gray-800'
                          }`}
                        >
                          {enrollment.assignedCourse.course.courseCode} - Section {enrollment.assignedCourse.section}
                        </Text>
                        <Text 
                          className={`text-xs ${
                            selectedEnrollment?._id === enrollment._id 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}
                        >
                          {enrollment.assignedCourse.course.courseName}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="bg-yellow-100 p-3 rounded-lg mb-4">
                  <Text className="text-yellow-800">
                    You are not enrolled in any classes. Please contact your administrator.
                  </Text>
                </View>
              )}
              
              <View className="items-center">
                <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <QRCode
                    value={qrData}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
                <Text className="text-gray-600 text-center mb-2">
                  Show this QR code to your instructor for attendance
                </Text>
                <Text className="text-sm text-gray-500 text-center">
                  Generated on: {new Date().toLocaleString()}
                </Text>
                
                {selectedEnrollment && (
                  <View className="mt-4 bg-blue-50 p-3 rounded-lg w-full">
                    <Text className="text-blue-800 font-medium text-center mb-1">
                      Currently selected: {selectedEnrollment.assignedCourse?.course?.courseCode || 
                                          selectedEnrollment.assignedCourse?.course?.courseId || 
                                          'Unknown Course'}
                    </Text>
                    <Text className="text-blue-600 text-xs text-center">
                      Section {selectedEnrollment.assignedCourse?.section || '?'} with {
                        selectedEnrollment.assignedCourse?.instructor?.fullName || 
                        (selectedEnrollment.assignedCourse?.instructor ? 
                          `${selectedEnrollment.assignedCourse.instructor.firstName || ''} ${selectedEnrollment.assignedCourse.instructor.lastName || ''}` : 
                          'Unknown Instructor')
                      }
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'attendance' && (
          <View className="px-4 py-6">
            <View className="bg-white rounded-lg shadow-sm p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">Attendance History</Text>
              </View>
              
              {/* Attendance records summary */}
              <View className="mb-6">
                <Text className="text-gray-600 mb-2">
                  Viewing your attendance records across all courses
                </Text>
              </View>
              
              {loadingAttendance ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#1D4ED8" />
                  <Text className="text-gray-500 mt-4">Loading attendance records...</Text>
                </View>
              ) : attendanceRecords.length === 0 ? (
                <View className="py-8 items-center">
                  <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-4">No attendance records found</Text>
                </View>
              ) : (
                <View>
                  <View className="flex-row items-center bg-gray-100 p-3 rounded-t-lg mb-2">
                    <Text className="font-medium text-gray-600 flex-1">Course Information</Text>
                    <Text className="font-medium text-gray-600 text-right mr-8">Date/Time</Text>
                    <Text className="font-medium text-gray-600 text-center min-w-20 mr-12">Status</Text>
                  </View>
                  
                  {attendanceRecords.map((record, index) => (
                    <Pressable
                      key={record._id || index}
                      className="border-b border-gray-100 py-4"
                      onPress={() => {
                        // Show modal with detailed info
                        setSelectedAttendance(record);
                        setShowAttendanceModal(true);
                      }}
                    >
                      <View className="flex-row items-center">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Text className="font-semibold text-gray-800">
                              {record.section?.course?.courseCode || record.section?.course?.courseId || 'Unknown'}
                            </Text>
                            <Text className="text-purple-500 text-xs ml-2 px-2 py-0.5 bg-purple-50 rounded-full">
                              Section: {record.section?.section || 
                               record.enrollment?.assignedCourse?.section || 
                               'Unknown'}
                            </Text>
                          </View>
                          <Text className="text-gray-500 text-xs" numberOfLines={1}>
                            {record.section?.course?.courseName || record.section?.course?.description || 'Unknown Course'}
                          </Text>
                        </View>
                        
                        <View className="items-end mr-12">
                          <Text className="text-gray-600 text-sm">
                            {new Date(record.date).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            {new Date(record.createdAt || record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center mr-3">
                          <View className={`items-center ${
                            record.status === 'present' 
                              ? "bg-green-100" 
                              : record.status === 'absent' 
                                ? "bg-red-100"
                                : record.status === 'excused'
                                  ? "bg-yellow-100"
                                  : "bg-gray-100"
                          } px-3 py-1 rounded-full min-w-20 justify-center`}>
                            <Text className={`text-sm font-medium ${
                              record.status === 'present' 
                                ? "text-green-800" 
                                : record.status === 'absent' 
                                  ? "text-red-800" 
                                  : record.status === 'excused'
                                    ? "text-yellow-800"
                                    : "text-gray-800"
                            }`}>
                              {record.status === 'present' ? 'Present' : 
                               record.status === 'absent' ? 'Absent' : 
                               record.status === 'excused' ? 'Excused' : 
                               record.status || 'Unknown'}
                            </Text>
                          </View>
                          
                          {/* Delete Button */}
                          <Pressable
                            className="pl-2 ml-4"
                            onPress={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent Pressable
                              confirmDeletion(record._id);
                            }}
                            disabled={deletingAttendance}
                          >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'profile' && renderProfileTab()}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View 
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS !== "web" ? insets.bottom || 12 : 12 }
        ]}
        className="flex-row border-t border-gray-200 bg-white"
      >
        {[
          { id: 'myqr', icon: 'qr-code-outline', label: 'My QR' },
          { 
            id: 'attendance', 
            icon: 'calendar-outline', 
            label: 'Attendance History'
          },
          { id: 'profile', icon: 'person-outline', label: 'Profile' }
        ].map((item) => (
          <Pressable
            key={item.id}
            className={`flex-1 py-2 ${activeTab === item.id ? 'bg-blue-50' : ''}`}
            onPress={() => setActiveTab(item.id)}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.95 : 1 }],
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View className="items-center">
              <View className={`p-2 rounded-full ${activeTab === item.id ? 'bg-blue-100' : ''}`}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={activeTab === item.id ? '#2563EB' : '#6B7280'} 
                />
              </View>
              <Text 
                className={`text-xs mt-1 text-center ${
                  activeTab === item.id 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-600'
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={item.id === 'attendance' ? { maxWidth: 120 } : {}}
              >
                {item.label}
              </Text>
            </View>
          </Pressable>
        ))}
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
    paddingBottom: 80, // Add padding at the bottom to account for the navigation bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 24,
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
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
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
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#1D4ED8',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  attendanceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  attendanceModalHeaderIcon: {
    marginRight: 12,
  },
  attendanceModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  attendanceModalCloseButton: {
    padding: 4,
  },
  attendanceStatusBadge: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    backgroundColor: '#F3F4F6',
  },
  attendanceStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  presentText: {
    color: '#059669',
  },
  absentText: {
    color: '#DC2626',
  },
  excusedText: {
    color: '#D97706',
  },
  unknownText: {
    color: '#6B7280',
  },
  attendanceModalBody: {
    padding: 16,
  },
  attendanceDetailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  attendanceDetailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendanceDetailTextContainer: {
    flex: 1,
  },
  attendanceDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  attendanceDetailValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  attendanceModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attendanceModalCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  attendanceModalCloseBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  attendanceModalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  attendanceModalDeleteBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Success Modal Styles
  successModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 350,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successModalIcon: {
    marginBottom: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  successModalButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  successModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 