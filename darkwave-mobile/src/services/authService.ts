import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';

export interface User {
  id: string;
  email: string;
  username?: string;
  subscriptionTier?: string;
  createdAt?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      
      if (response.data.success && response.data.token) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.data.token);
        if (response.data.user) {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.user));
        }
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed',
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Network error. Please try again.',
      };
    }
  },

  async register(email: string, password: string, username?: string): Promise<AuthResult> {
    try {
      const response = await apiClient.post('/api/auth/register', { 
        email, 
        password,
        username: username || email.split('@')[0],
      });
      
      if (response.data.success && response.data.token) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.data.token);
        if (response.data.user) {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.user));
        }
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Registration failed',
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Network error. Please try again.',
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  },

  async validateSession(): Promise<AuthResult> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      const response = await apiClient.get('/api/auth/me');
      
      if (response.data.user) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.user));
        return {
          success: true,
          user: response.data.user,
          token,
        };
      }
      
      return { success: false, message: 'Session invalid' };
    } catch (error: any) {
      await this.logout();
      return {
        success: false,
        message: error.response?.data?.message || 'Session validation failed',
      };
    }
  },

  async updateUser(user: Partial<User>): Promise<void> {
    try {
      const existingUser = await this.getStoredUser();
      if (existingUser) {
        const updatedUser = { ...existingUser, ...user };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  },
};

export default authService;
