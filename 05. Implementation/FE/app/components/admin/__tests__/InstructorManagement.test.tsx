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

describe('InstructorManagement Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Testing fetching instructors
  it('fetches instructors data from API successfully', async () => {
    const mockInstructorsData = [
      {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        instructorId: '123456-AB-12',
        program: 'Computer Science',
        faculty: 'Engineering',
        gmail: 'john.doe@gmail.com'
      },
      {
        _id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        instructorId: '654321-CD-34',
        program: 'Mathematics',
        faculty: 'Science',
        gmail: 'jane.smith@gmail.com'
      }
    ];

    const mockResponse = {
      data: mockInstructorsData
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call the API directly
    const response = await apiClient.get('/instructors');

    // Assert that API was called with correct endpoint
    expect(apiClient.get).toHaveBeenCalledWith('/instructors');

    // Verify the response
    expect(response.data).toEqual(mockInstructorsData);
    expect(response.data.length).toBe(2);
    expect(response.data[0].firstName).toBe('John');
    expect(response.data[1].firstName).toBe('Jane');
  });

  // Test 2: This test will FAIL - Testing deleting an instructor
  it('deletes an instructor successfully', async () => {
    const instructorId = '1';
    const mockResponse = {
      data: {
        success: true,
        message: 'Instructor deleted successfully'
      }
    };

    (apiClient.delete as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call the API directly
    const response = await apiClient.delete(`/instructors/${instructorId}`);

    // Assert that API was called with correct endpoint
    expect(apiClient.delete).toHaveBeenCalledWith(`/instructors/${instructorId}`);

    // This assertion will FAIL - wrong expected message
    expect(response.data.message).toBe('Wrong message to make test fail');
  });

  // Test 3: This test will FAIL - Testing handling API error when fetching instructors
  it('handles API errors when fetching instructors', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Failed to fetch instructors'
        }
      }
    };

    (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

    try {
      // Call the API directly
      await apiClient.get('/instructors');
      // This test should go into the catch block, but we'll prevent it
      // by resolving the promise instead of rejecting it in a real situation
      expect('API call succeeded unexpectedly').toBe('API call should have failed');
    } catch (error: any) {
      // This assertion will FAIL - wrong expected message
      expect(error.response.data.message).toBe('Wrong error message');
    }
  });

  // Test 4: This test will FAIL - Testing processing instructor image URLs
  it('processes instructor image URLs correctly', async () => {
    // Import the getImageUrl function directly
    const { getImageUrl } = require('../../../utils/imageUtils');

    const originalUrl = 'http://example.com/photo.jpg';
    const processedUrl = getImageUrl(originalUrl);

    // This assertion will FAIL - The mock returns 'processed_http://example.com/photo.jpg'
    // but we're expecting something else
    expect(processedUrl).toBe('wrong_processed_url');
    expect(getImageUrl).toHaveBeenCalledWith(originalUrl);
  });

  // Test 5: This test will FAIL - Testing handling API error when deleting an instructor
  it('handles API errors when deleting an instructor', async () => {
    const instructorId = '1';
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Failed to delete instructor'
        }
      }
    };

    (apiClient.delete as jest.Mock).mockRejectedValueOnce(mockError);

    // This will FAIL - We're expecting the API call to succeed but it will fail
    const response = await apiClient.delete(`/instructors/${instructorId}`);
    expect(response.data.success).toBe(true);
  });

  // Test 6: Testing filtering instructors after deletion
  it('filters instructors array after deletion', () => {
    // Start with an array of instructors
    const instructors = [
      {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        instructorId: '123456-AB-12',
        program: 'Computer Science',
        faculty: 'Engineering',
        gmail: 'john.doe@gmail.com'
      },
      {
        _id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        instructorId: '654321-CD-34',
        program: 'Mathematics',
        faculty: 'Science',
        gmail: 'jane.smith@gmail.com'
      },
      {
        _id: '3',
        firstName: 'Bob',
        lastName: 'Johnson',
        instructorId: '987654-EF-56',
        program: 'Physics',
        faculty: 'Science',
        gmail: 'bob.johnson@gmail.com'
      }
    ];

    // ID of the instructor to delete
    const instructorIdToDelete = '2';

    // Filter the array to simulate deletion
    const updatedInstructors = instructors.filter(
      instructor => instructor._id !== instructorIdToDelete
    );

    // Verify that the instructor was removed
    expect(updatedInstructors.length).toBe(2);
    expect(updatedInstructors.find(i => i._id === instructorIdToDelete)).toBeUndefined();
    expect(updatedInstructors[0]._id).toBe('1');
    expect(updatedInstructors[1]._id).toBe('3');
  });
}); 