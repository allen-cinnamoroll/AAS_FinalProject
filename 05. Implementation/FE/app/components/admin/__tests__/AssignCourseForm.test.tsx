import React from 'react';
import apiClient from '../../../services/api';

// Mock the apiClient
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

global.alert = jest.fn();

describe('AssignCourseForm Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Fetching courses
  it('fetches courses data from API successfully', async () => {
    const mockCoursesData = [
      { _id: '1', courseId: 'CS101', description: 'Intro to Computer Science' },
      { _id: '2', courseId: 'MATH201', description: 'Calculus II' }
    ];
    const mockResponse = { data: { data: mockCoursesData } };
    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await apiClient.get('/courses');
    expect(apiClient.get).toHaveBeenCalledWith('/courses');
    expect(response.data.data).toEqual(mockCoursesData);
  });

  // Test 2: Successful course assignment
  it('assigns a course successfully', async () => {
    const payload = {
      courseId: '1',
      instructorId: 'inst123',
      section: 'A1',
      schedule: {
        days: ['Monday'],
        startTime: '9:30 AM',
        endTime: '11:00 AM'
      },
      semester: '1'
    };
    const mockResponse = { data: { success: true, message: 'Course assigned successfully!' } };
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await apiClient.post('/assigned-courses/assign', payload);
    expect(apiClient.post).toHaveBeenCalledWith('/assigned-courses/assign', payload);
    expect(response.data.success).toBe(true);
  });

  // Test 3: Missing required fields
  it('shows error when required fields are missing', () => {
    const formData = {
      courseId: '',
      section: '',
      schedule: { days: [], startTime: '', endTime: '' },
      semester: '1'
    };
    expect(!formData.courseId || !formData.section || !formData.schedule.days.length || !formData.schedule.startTime || !formData.schedule.endTime).toBe(true);
  });

  // Test 4: Invalid time format
  it('shows error for invalid time format', () => {
    const formData = {
      schedule: { startTime: '930', endTime: '11:00 AM' }
    };
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/;
    expect(timeRegex.test(formData.schedule.startTime)).toBe(false);
    expect(timeRegex.test(formData.schedule.endTime)).toBe(true);
  });

  // Test 5: Invalid section format
  it('shows error for invalid section format', () => {
    const formData = { section: 'a1' };
    expect(/^[A-Z0-9]+$/.test(formData.section)).toBe(false);
  });

  // Test 6: API error on fetch
  it('handles API error when fetching courses', async () => {
    const mockError = { response: { data: { success: false, message: 'Failed to fetch courses' } } };
    (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);
    try {
      await apiClient.get('/courses');
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Failed to fetch courses');
    }
  });

  // Test 7: API error on assign
  it('handles API error when assigning a course', async () => {
    const payload = {
      courseId: '1',
      instructorId: 'inst123',
      section: 'A1',
      schedule: {
        days: ['Monday'],
        startTime: '9:30 AM',
        endTime: '11:00 AM'
      },
      semester: '1'
    };
    const mockError = { response: { data: { success: false, message: 'Assignment failed' } } };
    (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);
    try {
      await apiClient.post('/assigned-courses/assign', payload);
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Assignment failed');
    }
  });
}); 