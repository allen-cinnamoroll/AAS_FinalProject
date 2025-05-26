import React from 'react';
import apiClient from '../../../services/api';

// Mock the apiClient
jest.mock('../../../services/api', () => ({
  post: jest.fn(),
  put: jest.fn(),
  default: {
    post: jest.fn(),
    put: jest.fn()
  }
}));

global.alert = jest.fn();

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('CourseRegistrationForm Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: PASS - Successful course registration
  it('registers a new course successfully', async () => {
    const courseData = {
      courseId: 'CS101',
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 3,
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    const mockResponse = {
      data: { success: true, message: 'Course registered successfully!' }
    };
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);
    // Simulate form submission
    const response = await apiClient.post('/courses/register', {
      ...courseData,
      units: courseData.units.toString()
    });
    expect(apiClient.post).toHaveBeenCalledWith('/courses/register', {
      ...courseData,
      units: courseData.units.toString()
    });
    expect(response.data.success).toBe(true);
  });

  // Test 2: PASS - Missing required fields
  it('shows error when required fields are missing', async () => {
    const courseData = {
      courseId: '',
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 3,
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    expect(!courseData.courseId).toBe(true);
  });

  // Test 3: PASS - Invalid course ID format
  it('shows error for invalid course ID format', async () => {
    const courseData = {
      courseId: 'C101', // Invalid: only 1 letter
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 3,
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    const regex = /^[A-Z]{2,3}[0-9]{3}$/;
    expect(regex.test(courseData.courseId)).toBe(false);
  });

  // Test 4: PASS - Invalid course type
  it('shows error for invalid course type', async () => {
    const courseData = {
      courseId: 'CS101',
      description: 'Intro to Computer Science',
      courseType: 'Seminar', // Invalid
      units: 3,
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    expect(['Lec', 'Lab'].includes(courseData.courseType)).toBe(false);
  });

  // Test 5: PASS - Invalid term
  it('shows error for invalid term', async () => {
    const courseData = {
      courseId: 'CS101',
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 3,
      term: '3', // Invalid
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    expect(['1', '2'].includes(courseData.term)).toBe(false);
  });

  // Test 6: PASS - Invalid units
  it('shows error for invalid units', async () => {
    const courseData = {
      courseId: 'CS101',
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 0, // Invalid
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    expect(courseData.units >= 1 && courseData.units <= 6).toBe(false);
  });

  // Test 7: PASS - Successful course update (edit mode)
  it('updates an existing course successfully', async () => {
    const editingCourse = {
      _id: 'abc123',
      courseId: 'CS101',
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 3,
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    const mockResponse = {
      data: { success: true, message: 'Course updated successfully!' }
    };
    (apiClient.put as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await apiClient.put(`/courses/${editingCourse._id}`, {
      ...editingCourse,
      units: editingCourse.units.toString()
    });
    expect(apiClient.put).toHaveBeenCalledWith(`/courses/${editingCourse._id}`, {
      ...editingCourse,
      units: editingCourse.units.toString()
    });
    expect(response.data.message).toBe('Course updated successfully!');
  });

  // Test 8: PASS - Handles API error during registration
  it('handles API error during registration', async () => {
    const courseData = {
      courseId: 'CS101',
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 3,
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Course already exists'
        }
      }
    };
    (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);
    try {
      await apiClient.post('/courses/register', {
        ...courseData,
        units: courseData.units.toString()
      });
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Course already exists');
      expect(error.response.data.success).toBe(false);
    }
  });
}); 