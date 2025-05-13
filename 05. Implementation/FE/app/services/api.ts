import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with actual backend URL
export const API_URL = "http://192.168.229.162:8000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Send token without Bearer prefix as backend expects
        config.headers.Authorization = token;
      }
      return config;
    } catch (error) {
      console.error('Error getting token:', error);
      return config;
    }
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('token');
      // You might want to add navigation logic here
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (userData: { username: string; gmail: string; password: string }) => {
    return apiClient.post('/admin/register', userData);
  },
  
  login: async (credentials: { gmail: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response;
  },
  
  verifyOtp: async (data: { gmail: string; otp: string }) => {
    const response = await apiClient.post('/auth/verify-otp', data);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response;
  },

  logout: async () => {
    try {
      // First, call the backend logout endpoint
      const response = await apiClient.post('/auth/logout');
      // Then, clear the token from storage
      await AsyncStorage.removeItem('token');
      return response;
    } catch (error) {
      // Still clear the token even if the API call fails
      await AsyncStorage.removeItem('token');
      throw error;
    }
  }
};

export default apiClient; 