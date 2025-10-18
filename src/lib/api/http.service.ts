/**
 * HTTP Service Layer - Best Practices
 *
 * Features:
 * - Clean API for all HTTP methods
 * - Flexible handling of body, params, and path parameters
 * - Toast notification control per request
 * - TypeScript generics for type safety
 * - Scalable and maintainable structure
 */

import type { AxiosResponse } from 'axios';
import axiosInstance from './axios.config';
import type { CustomAxiosRequestConfig } from './axios.config';

/**
 * Request configuration options
 */
export interface RequestOptions extends CustomAxiosRequestConfig {
  // Explicitly control toast notifications
  showSuccessToast?: boolean;  // Show success toast
  showErrorToast?: boolean;    // Show error toast (default: true)
  successMessage?: string;     // Custom success message
}

/**
 * HTTP Service - Functional API wrapper
 * Handles body, params, and path parameters elegantly
 */
export const httpService = {
  /**
   * GET request
   * @param endpoint - API endpoint (can include path params: '/users/:id')
   * @param options - Query params and request config
   */
  async get<TResponse = unknown>(
    endpoint: string,
    options?: {
      params?: Record<string, any>;
      config?: RequestOptions;
    }
  ): Promise<AxiosResponse<TResponse>> {
    return axiosInstance.get<TResponse>(endpoint, {
      params: options?.params,
      ...options?.config,
      meta: {
        showToast: options?.config?.showSuccessToast ?? false,
        silent: options?.config?.showErrorToast === false,
        ...options?.config?.meta,
      },
    } as CustomAxiosRequestConfig);
  },

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param options - Request body, query params, and config
   */
  async post<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    options?: {
      body?: TBody;
      params?: Record<string, any>;
      config?: RequestOptions;
    }
  ): Promise<AxiosResponse<TResponse>> {
    return axiosInstance.post<TResponse>(endpoint, options?.body, {
      params: options?.params,
      ...options?.config,
      meta: {
        showToast: options?.config?.showSuccessToast ?? true,
        silent: options?.config?.showErrorToast === false,
        successMessage: options?.config?.successMessage,
        ...options?.config?.meta,
      },
    } as CustomAxiosRequestConfig);
  },

  /**
   * PUT request
   * @param endpoint - API endpoint (can include :id)
   * @param options - Request body, query params, and config
   */
  async put<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    options?: {
      body?: TBody;
      params?: Record<string, any>;
      config?: RequestOptions;
    }
  ): Promise<AxiosResponse<TResponse>> {
    return axiosInstance.put<TResponse>(endpoint, options?.body, {
      params: options?.params,
      ...options?.config,
      meta: {
        showToast: options?.config?.showSuccessToast ?? true,
        silent: options?.config?.showErrorToast === false,
        successMessage: options?.config?.successMessage,
        ...options?.config?.meta,
      },
    } as CustomAxiosRequestConfig);
  },

  /**
   * PATCH request
   * @param endpoint - API endpoint (can include :id)
   * @param options - Request body, query params, and config
   */
  async patch<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    options?: {
      body?: TBody;
      params?: Record<string, any>;
      config?: RequestOptions;
    }
  ): Promise<AxiosResponse<TResponse>> {
    return axiosInstance.patch<TResponse>(endpoint, options?.body, {
      params: options?.params,
      ...options?.config,
      meta: {
        showToast: options?.config?.showSuccessToast ?? true,
        silent: options?.config?.showErrorToast === false,
        successMessage: options?.config?.successMessage,
        ...options?.config?.meta,
      },
    } as CustomAxiosRequestConfig);
  },

  /**
   * DELETE request
   * @param endpoint - API endpoint (can include :id)
   * @param options - Query params and request config
   */
  async delete<TResponse = unknown>(
    endpoint: string,
    options?: {
      params?: Record<string, any>;
      config?: RequestOptions;
    }
  ): Promise<AxiosResponse<TResponse>> {
    return axiosInstance.delete<TResponse>(endpoint, {
      params: options?.params,
      ...options?.config,
      meta: {
        showToast: options?.config?.showSuccessToast ?? true,
        silent: options?.config?.showErrorToast === false,
        successMessage: options?.config?.successMessage,
        ...options?.config?.meta,
      },
    } as CustomAxiosRequestConfig);
  },
};

/**
 * Helper function to build endpoint with path parameters
 * @example buildEndpoint('/users/:id', { id: '123' }) => '/users/123'
 */
export function buildEndpoint(
  template: string,
  pathParams?: Record<string, string | number>
): string {
  if (!pathParams) return template;

  let endpoint = template;
  Object.entries(pathParams).forEach(([key, value]) => {
    endpoint = endpoint.replace(`:${key}`, String(value));
  });

  return endpoint;
}

export default httpService;
