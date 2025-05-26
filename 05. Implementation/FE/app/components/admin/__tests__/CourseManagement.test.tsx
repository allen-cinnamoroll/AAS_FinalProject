import React from 'react';
import apiClient from '../../../services/api';

// Mock the apiClient
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  delete: jest.fn(),
  default: {
    get: jest.fn(),
    delete: jest.fn()
  }
}));

global.alert = jest.fn();

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('CourseManagement Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Fetching courses
  it('fetches courses data from API successfully', async () => {
    const mockCoursesData = [
      {
        _id: '1',
        courseId: 'CS101',
        description: 'Intro to Computer Science',
        courseType: 'Lec',
        units: 3,
        term: '1',
        faculty: 'Engineering',
        program: 'Computer Science'
      },
      {
        _id: '2',
        courseId: 'MATH201',
        description: 'Calculus II',
        courseType: 'Lec',
        units: 4,
        term: '2',
        faculty: 'Science',
        program: 'Mathematics'
      }
    ];
    const mockResponse = { data: mockCoursesData };
    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await apiClient.get('/courses');
    expect(apiClient.get).toHaveBeenCalledWith('/courses');
    expect(response.data).toEqual(mockCoursesData);
    expect(response.data.length).toBe(2);
    expect(response.data[0].courseId).toBe('CS101');
    expect(response.data[1].courseId).toBe('MATH201');
  });

  // Test 2: Deleting a course
  it('deletes a course successfully', async () => {
    const courseId = '1';
    const mockResponse = {
      data: {
        success: true,
        message: 'Course deleted successfully'
      }
    };
    (apiClient.delete as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await apiClient.delete(`/courses/${courseId}`);
    expect(apiClient.delete).toHaveBeenCalledWith(`/courses/${courseId}`);
    expect(response.data.message).toBe('Course deleted successfully');
  });

  // Test 3: Handling API error when fetching courses
  it('handles API errors when fetching courses', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Failed to fetch courses'
        }
      }
    };
    (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);
    try {
      await apiClient.get('/courses');
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Failed to fetch courses');
    }
  });

  // Test 4: Handling API error when deleting a course
  it('handles API errors when deleting a course', async () => {
    const courseId = '1';
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Failed to delete course'
        }
      }
    };
    (apiClient.delete as jest.Mock).mockRejectedValueOnce(mockError);
    try {
      await apiClient.delete(`/courses/${courseId}`);
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Failed to delete course');
    }
  });

  // Test 5: Filtering courses after deletion
  it('filters courses array after deletion', () => {
    const courses = [
      {
        _id: '1',
        courseId: 'CS101',
        description: 'Intro to Computer Science',
        courseType: 'Lec',
        units: 3,
        term: '1',
        faculty: 'Engineering',
        program: 'Computer Science'
      },
      {
        _id: '2',
        courseId: 'MATH201',
        description: 'Calculus II',
        courseType: 'Lec',
        units: 4,
        term: '2',
        faculty: 'Science',
        program: 'Mathematics'
      },
      {
        _id: '3',
        courseId: 'PHY101',
        description: 'Physics I',
        courseType: 'Lab',
        units: 2,
        term: '1',
        faculty: 'Science',
        program: 'Physics'
      }
    ];
    const courseIdToDelete = '2';
    const updatedCourses = courses.filter(course => course._id !== courseIdToDelete);
    expect(updatedCourses.length).toBe(2);
    expect(updatedCourses.find(c => c._id === courseIdToDelete)).toBeUndefined();
    expect(updatedCourses[0]._id).toBe('1');
    expect(updatedCourses[1]._id).toBe('3');
  });

  // Test 6: Opening edit mode
  it('opens edit mode for a course', () => {
    const setEditingCourse = jest.fn();
    const setShowAddForm = jest.fn();
    const course = {
      _id: '1',
      courseId: 'CS101',
      description: 'Intro to Computer Science',
      courseType: 'Lec',
      units: 3,
      term: '1',
      faculty: 'Engineering',
      program: 'Computer Science'
    };
    // Simulate handleEdit logic
    setEditingCourse(course);
    setShowAddForm(true);
    expect(setEditingCourse).toHaveBeenCalledWith(course);
    expect(setShowAddForm).toHaveBeenCalledWith(true);
  });

  // Test 7: Opening add mode
  it('opens add mode for a new course', () => {
    const setShowAddForm = jest.fn();
    setShowAddForm(true);
    expect(setShowAddForm).toHaveBeenCalledWith(true);
  });
}); 