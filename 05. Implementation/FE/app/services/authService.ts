import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { error, log } from '../utils/logger';

const API_URL = 'http://192.168.142.162:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    log('Making request to:', config.url);
    return config;
  },
  (err) => {
    error('Request error:', err);
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (response) => {
    log('Response received:', response.status);
    return response;
  },
  (err) => {
    error('Response error:', err);
    return Promise.reject(err);
  }
);

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });

    if (response.data.success) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      }));
      return response.data;
    }

    throw new Error('Invalid email or password');
  } catch (err: any) {
    if (err.response?.status === 401) {
      throw new Error('Invalid email or password');
    } else if (err.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

const logout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

const register = async (username: string, email: string, password: string, role?: string) => {
  try {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
      role,
      isActive: false,
    });

    if (response.data.success) {
      try {
        await sendOTP(email);
      } catch (otpError) {
        return {
          ...response.data,
          warning: 'User registered but OTP could not be sent. Please contact support.',
        };
      }
      return response.data;
    }

    throw new Error('Registration failed. Please try again.');
  } catch (err: any) {
    if (err.response?.status === 400) {
      throw new Error('Username or email already exists');
    } else if (err.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Registration failed. Please try again.');
    }
  }
};

const sendOTP = async (email: string) => {
  const response = await api.post('/otp/send', { email });
  return response.data;
};

const verifyOTP = async (email: string, otp: string) => {
  const response = await api.post('/otp/verify', { email, otp });
  if (response.data.success) await activateAccount(email);
  return response.data;
};

const activateAccount = async (email: string) => {
  const response = await api.post('/auth/activate', { email });
  return response.data;
};

const getCurrentUser = async () => {
  const userStr = await AsyncStorage.getItem('user');
  if (!userStr) throw new Error('No user data found');
  return JSON.parse(userStr);
};

const authService = {
  login,
  logout,
  register,
  getCurrentUser,
  sendOTP,
  verifyOTP,
  activateAccount,
};

export default authService;
