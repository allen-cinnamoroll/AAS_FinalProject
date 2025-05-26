import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Register from '../Register';
import authService from '../../services/api';

// Mock the auth service
jest.mock('../../services/api', () => ({
  register: jest.fn()
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar'
}));

describe('Register Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<Register onClose={mockOnClose} />);
    
    expect(getByText('Register as Admin')).toBeTruthy();
    expect(getByPlaceholderText('Enter your username')).toBeTruthy();
    expect(getByPlaceholderText('your.email@gmail.com')).toBeTruthy();
    expect(getByPlaceholderText('Create a password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm your password')).toBeTruthy();
  });

  it('shows error message when fields are empty', () => {
    const { getByText } = render(<Register onClose={mockOnClose} />);
    
    fireEvent.press(getByText('Register'));
    
    expect(getByText('Please fill all required fields')).toBeTruthy();
  });

  it('shows error when passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = render(<Register onClose={mockOnClose} />);
    
    // Fill in all required fields
    const usernameInput = getByPlaceholderText('Enter your username');
    const emailInput = getByPlaceholderText('your.email@gmail.com');
    const passwordInput = getByPlaceholderText('Create a password');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(emailInput, 'test@gmail.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password456');
    
    // Verify the inputs have the correct values
    expect(usernameInput.props.value).toBe('testuser');
    expect(emailInput.props.value).toBe('test@gmail.com');
    expect(passwordInput.props.value).toBe('password123');
    expect(confirmPasswordInput.props.value).toBe('password456');
    
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('shows error for invalid gmail', () => {
    const { getByText, getByPlaceholderText } = render(<Register onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('your.email@gmail.com'), 'invalid@email.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    fireEvent.press(getByText('Register'));
    
    expect(getByText('Please enter a valid Gmail address')).toBeTruthy();
  });

  it('shows error for short password', () => {
    const { getByText, getByPlaceholderText } = render(<Register onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('your.email@gmail.com'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), '12345');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), '12345');
    fireEvent.press(getByText('Register'));
    
    expect(getByText('Password must be at least 6 characters long')).toBeTruthy();
  });

  it('successfully registers a user', async () => {
    const mockResponse = { data: { success: true } };
    (authService.register as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { getByText, getByPlaceholderText } = render(<Register onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('your.email@gmail.com'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(getByText('Registered Successfully')).toBeTruthy();
    });

    expect(authService.register).toHaveBeenCalledWith({
      username: 'testuser',
      gmail: 'test@gmail.com',
      password: 'password123'
    });
  });

  it('handles registration failure', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Registration failed'
        }
      }
    };
    (authService.register as jest.Mock).mockRejectedValueOnce(mockError);

    const { getByText, getByPlaceholderText } = render(<Register onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('your.email@gmail.com'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(getByText('Registration failed')).toBeTruthy();
    });
  });
}); 