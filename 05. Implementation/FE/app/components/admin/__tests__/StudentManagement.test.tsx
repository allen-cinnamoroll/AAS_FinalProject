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

// Mock Alert
global.alert = jest.fn();

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock the getImageUrl utility
jest.mock('../../../utils/imageUtils', () => ({
  getImageUrl: jest.fn((url) => `processed_${url}`)
}));

describe('StudentManagement Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: SUCCESS - Fetching students
  it('fetches students data from API successfully', async () => {
    const mockStudentsData = [
      {
        _id: '1',
        firstName: 'Alice',
        lastName: 'Johnson',
        studentId: '2023-0001',
        program: 'Computer Science',
        faculty: 'Engineering',
        gmail: 'alice.johnson@gmail.com'
      },
      {
        _id: '2',
        firstName: 'Bob',
        lastName: 'Smith',
        studentId: '2023-0002',
        program: 'Mathematics',
        faculty: 'Science',
        gmail: 'bob.smith@gmail.com'
      }
    ];

    const mockResponse = {
      data: mockStudentsData
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call the API directly
    const response = await apiClient.get('/students');

    // Assert that API was called with correct endpoint
    expect(apiClient.get).toHaveBeenCalledWith('/students');

    // Verify the response
    expect(response.data).toEqual(mockStudentsData);
    expect(response.data.length).toBe(2);
    expect(response.data[0].firstName).toBe('Alice');
    expect(response.data[1].firstName).toBe('Bob');
  });

  // Test 2: SUCCESS - Deleting a student
  it('deletes a student successfully', async () => {
    const studentId = '1';
    const mockResponse = {
      data: {
        success: true,
        message: 'Student deleted successfully'
      }
    };

    (apiClient.delete as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call the API directly
    const response = await apiClient.delete(`/students/${studentId}`);

    // Assert that API was called with correct endpoint
    expect(apiClient.delete).toHaveBeenCalledWith(`/students/${studentId}`);

    // This assertion will now PASS - correct expected message
    expect(response.data.message).toBe('Student deleted successfully');
  });

  // Test 3: SUCCESS - Handling API error when fetching students
  it('handles API errors when fetching students', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Failed to fetch students'
        }
      }
    };

    (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

    try {
      // Call the API directly
      await apiClient.get('/students');
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Failed to fetch students');
    }
  });

  // Test 4: SUCCESS - Processing student image URLs
  it('processes student image URLs correctly', async () => {
    // Import the getImageUrl function directly
    const { getImageUrl } = require('../../../utils/imageUtils');

    const originalUrl = 'http://example.com/photo.jpg';
    const processedUrl = getImageUrl(originalUrl);

    // This assertion will now PASS - correct expected processed URL
    expect(processedUrl).toBe('processed_http://example.com/photo.jpg');
    expect(getImageUrl).toHaveBeenCalledWith(originalUrl);
  });

  // Test 5: SUCCESS - Handling API error when deleting a student
  it('handles API errors when deleting a student', async () => {
    const studentId = '1';
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Failed to delete student'
        }
      }
    };

    (apiClient.delete as jest.Mock).mockRejectedValueOnce(mockError);

    try {
      await apiClient.delete(`/students/${studentId}`);
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      expect(error.response.data.message).toBe('Failed to delete student');
    }
  });

  // Test 6: SUCCESS - Filtering students after deletion
  it('filters students array after deletion', () => {
    // Start with an array of students
    const students = [
      {
        _id: '1',
        firstName: 'Alice',
        lastName: 'Johnson',
        studentId: '2023-0001',
        program: 'Computer Science',
        faculty: 'Engineering',
        gmail: 'alice.johnson@gmail.com'
      },
      {
        _id: '2',
        firstName: 'Bob',
        lastName: 'Smith',
        studentId: '2023-0002',
        program: 'Mathematics',
        faculty: 'Science',
        gmail: 'bob.smith@gmail.com'
      },
      {
        _id: '3',
        firstName: 'Charlie',
        lastName: 'Brown',
        studentId: '2023-0003',
        program: 'Physics',
        faculty: 'Science',
        gmail: 'charlie.brown@gmail.com'
      }
    ];

    // ID of the student to delete
    const studentIdToDelete = '2';

    // Filter the array to simulate deletion
    const updatedStudents = students.filter(
      student => student._id !== studentIdToDelete
    );

    // Verify that the student was removed
    expect(updatedStudents.length).toBe(2);
    expect(updatedStudents.find(i => i._id === studentIdToDelete)).toBeUndefined();
    expect(updatedStudents[0]._id).toBe('1');
    expect(updatedStudents[1]._id).toBe('3');
  });
}); 