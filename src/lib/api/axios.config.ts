/**
 * Axios Configuration with Best Practices
 *
 * Features:
 * - Centralized axios instance
 * - Request/Response interceptors
 * - Automatic token management
 * - Retry logic for failed requests
 * - Error transformation
 * - TypeScript support
 */

import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import toast from 'react-hot-toast';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 3;

/**
 * Extended Axios Request Config with custom meta options
 */
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  meta?: {
    showToast?: boolean; // Show success toast for mutations
    silent?: boolean; // Suppress error toasts
    skipAuth?: boolean; // Skip authorization header
    successMessage?: string; // Custom success message
  };
}

/**
 * Create axios instance with base configuration
 */
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Configure retry logic for network errors
 */
axiosRetry(axiosInstance, {
  retries: RETRY_ATTEMPTS,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkError(error) ||
      axiosRetry.isRetryableError(error) ||
      (error.response?.status === 0)
    );
  },
});

/**
 * Auth token management
 */
const getAuthToken = (): string | null => {
  try {
    const authData = localStorage.getItem('Auth');
    if (!authData) return null;

    const parsed = JSON.parse(authData);
    return parsed?.access_token ?? parsed?.accessToken ?? null;
  } catch (error) {
    console.warn('Invalid Auth token in localStorage:', error);
    return null;
  }
};

/**
 * Request Interceptor
 * - Adds authorization token
 * - Logs requests in development
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const customConfig = config as InternalAxiosRequestConfig & CustomAxiosRequestConfig;

    // Add authorization token unless explicitly skipped
    if (!customConfig.meta?.skipAuth) {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Development logging
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handles success toasts
 * - Global error handling
 * - 401 auto-logout
 */
axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config as CustomAxiosRequestConfig;

    // Show success toast for mutations (POST, PUT, PATCH, DELETE)
    if (config.meta?.showToast) {
      const message = config.meta.successMessage || response.data?.message || 'Operation successful';

      toast.success(message, {
        position: 'top-right',
        duration: 4000,
      });
    }

    // Development logging
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError<{ message?: string; errors?: string[] }>) => {
    const config = error.config as CustomAxiosRequestConfig;

    // Skip toast if silent mode is enabled
    if (config?.meta?.silent) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || 'An error occurred';

    // Handle 401 Unauthorized - clear auth and redirect
    if (status === 401) {
      localStorage.clear();
      toast.error('Session expired. Please login again.', {
        position: 'top-right',
        duration: 4000,
      });

      // Redirect to login (adjust path as needed)
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);

      return Promise.reject(error);
    }

    // Show error toast for other errors
    if (error.response) {
      toast.error(message, {
        position: 'top-right',
        duration: 4000,
      });
    } else if (error.request) {
      toast.error('Network error. Please check your connection.', {
        position: 'top-right',
        duration: 4000,
      });
    } else {
      toast.error('An unexpected error occurred', {
        position: 'top-right',
        duration: 4000,
      });
    }

    // Development logging
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        status,
        message,
        url: error.config?.url,
        error,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
