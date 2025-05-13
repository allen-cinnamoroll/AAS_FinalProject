import apiClient from './api';

interface LoginCredentials {
  gmail: string;
  password: string;
}

interface UserData {
  id: string;
  name: string;
  gmail: string;
  role: string;
  userType: string;
  isEmailVerified: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: UserData;
}

interface OTPCredentials {
  gmail: string;
  otp: string;
}

// Standard error handling function
const handleApiError = (error: any) => {
  if (error.response?.data) {
    // API returned an error response with data
    return error.response.data;
  }
  if (error.request) {
    // Request was made but no response received (network error)
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.'
    };
  }
  // Something else happened while setting up the request
  return {
    success: false,
    message: error.message || 'An unexpected error occurred.'
  };
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('Attempting login with:', {
        gmail: credentials.gmail,
        password: credentials.password ? '[REDACTED]' : '[EMPTY]'
      });
      
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login API response:', {
        success: response.data.success,
        message: response.data.message,
        hasToken: !!response.data.token,
        userData: response.data.data ? {
          userType: response.data.data.userType,
          isEmailVerified: response.data.data.isEmailVerified
        } : null
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      return handleApiError(error);
    }
  },

  async verifyOTP(credentials: OTPCredentials): Promise<LoginResponse> {
    try {
      console.log('Sending OTP verification with:', {
        gmail: credentials.gmail,
        otp: credentials.otp
      });
      
      const response = await apiClient.post('/auth/verify-otp', credentials);
      console.log('OTP verification API response:', {
        success: response.data.success,
        message: response.data.message,
        hasToken: !!response.data.token
      });
      
      return response.data;
    } catch (error: any) {
      console.error('OTP verification API error:', error);
      return handleApiError(error);
    }
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/auth/logout');
      return {
        success: true,
        message: response.data.message || 'Successfully logged out'
      };
    } catch (error: any) {
      console.error('Logout API error:', error);
      return handleApiError(error);
    }
  },

  async getCurrentUser(): Promise<UserData | null> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.data;
    } catch (error: any) {
      console.error('Get current user API error:', error);
      return null;
    }
  },
  
  // Method to check if token is valid (can be used for automatic logout when token expires)
  async validateToken(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/validate-token');
      return response.data.success === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}; 