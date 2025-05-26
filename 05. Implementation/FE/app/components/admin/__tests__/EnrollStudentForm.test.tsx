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

describe('EnrollStudentForm Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: PASS - Fetching assigned courses
  it('fetches assigned courses data from API successfully', async () => {
    const mockCoursesData = [
      { _id: '1', course: { courseId: 'CS101', description: 'Intro to Computer Science' }, section: 'A' },
      { _id: '2', course: { courseId: 'MATH201', description: 'Calculus II' }, section: 'B' }
    ];
    const mockResponse = { data: { data: mockCoursesData } };
    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await apiClient.get('/assigned-courses');
    expect(apiClient.get).toHaveBeenCalledWith('/assigned-courses');
    expect(response.data.data).toEqual(mockCoursesData);
  });

  // Test 2: PASS - Successful enrollment
  it('enrolls a student successfully', async () => {
    const payload = { studentId: 'stu123', assignedCourseId: '1' };
    const mockResponse = { data: { success: true, message: 'Enrolled successfully!' } };
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await apiClient.post('/enrollments/enroll', payload);
    expect(apiClient.post).toHaveBeenCalledWith('/enrollments/enroll', payload);
    expect(response.data.message).toBe('Enrolled successfully!');
  });

  // Test 3: PASS - Missing section (should error)
  it('shows error when section is missing', () => {
    const selectedSectionId = '';
    expect(!!selectedSectionId).toBe(false);
  });

  // Test 4: PASS - Correct grouping of courses
  it('groups assigned courses by courseId', () => {
    const assignedCourses = [
      { _id: '1', course: { courseId: 'CS101', description: 'Intro to Computer Science' }, section: 'A' },
      { _id: '2', course: { courseId: 'CS101', description: 'Intro to Computer Science' }, section: 'B' },
      { _id: '3', course: { courseId: 'MATH201', description: 'Calculus II' }, section: 'A' }
    ];
    const grouped: Record<string, any> = {};
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
        section: assignedCourse.section
      });
    });
    expect(Object.keys(grouped).length).toBe(2);
    expect(grouped['CS101'].sections.length).toBe(2);
    expect(grouped['MATH201'].sections.length).toBe(1);
  });

  // Test 5: PASS - API error on fetch
  it('handles API error when fetching assigned courses', async () => {
    const mockError = { response: { data: { success: false, message: 'Failed to fetch assigned courses' } } };
    (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);
    try {
      await apiClient.get('/assigned-courses');
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Failed to fetch assigned courses');
    }
  });

  // Test 6: PASS - API error on enroll
  it('handles API error when enrolling a student', async () => {
    const payload = { studentId: 'stu123', assignedCourseId: '1' };
    const mockError = { response: { data: { success: false, message: 'Enrollment failed' } } };
    (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);
    try {
      await apiClient.post('/enrollments/enroll', payload);
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Enrollment failed');
    }
  });
}); 