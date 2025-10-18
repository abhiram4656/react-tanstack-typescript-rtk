/**
 * Axios Base Query for RTK Query
 *
 * This adapter allows RTK Query to use Axios instead of fetch API
 * Benefits:
 * - Leverage existing Axios interceptors
 * - Consistent error handling across the app
 * - Request/response transformations
 * - Retry logic via axios-retry
 * - TypeScript type safety
 *
 * Enterprise Pattern: Reuse existing HTTP infrastructure
 */

import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import axiosInstance from '../../lib/api/axios.config';
import type { CustomAxiosRequestConfig } from '../../lib/api/axios.config';

/**
 * Base Query Arguments
 */
interface AxiosBaseQueryArgs {
  baseUrl?: string;
}

/**
 * Custom Error Type for RTK Query
 *
 * MNC Standard: Standardized error responses across the application
 */
export interface ApiError {
  status?: number;
  data?: {
    message?: string;
    errors?: string[];
    [key: string]: any;
  };
  message?: string;
}

/**
 * Request Configuration extending Axios config
 */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  url: string;
  method?: AxiosRequestConfig['method'];
  body?: any;
  params?: Record<string, any>;
  // RTK Query specific options
  meta?: {
    showToast?: boolean;
    showErrorToast?: boolean;
    silent?: boolean;
    skipAuth?: boolean;
    successMessage?: string;
  };
}

/**
 * Axios Base Query Function
 *
 * This function adapts Axios to work with RTK Query's expected interface
 */
export const axiosBaseQuery = (
  { baseUrl = '' }: AxiosBaseQueryArgs = {}
): BaseQueryFn<ExtendedAxiosRequestConfig, unknown, ApiError> => {
  return async ({ url, method = 'GET', body, params, meta, ...rest }) => {
    try {
      /**
       * Construct full URL
       */
      const fullUrl = baseUrl ? `${baseUrl}${url}` : url;

      /**
       * Build Axios request config with custom meta
       */
      const config: CustomAxiosRequestConfig = {
        url: fullUrl,
        method,
        data: body,
        params,
        ...rest,
        meta: {
          showToast: meta?.showToast ?? false,
          silent: meta?.silent ?? meta?.showErrorToast === false,
          skipAuth: meta?.skipAuth,
          successMessage: meta?.successMessage,
        },
      };

      /**
       * Execute request via Axios instance
       * This leverages all configured interceptors
       */
      const result = await axiosInstance.request(config);

      /**
       * NOTE: Success toasts are handled by Axios response interceptor
       * (see axios.config.ts:121-127)
       * We don't show toasts here to avoid duplicates
       */

      /**
       * Return success response
       */
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError<{
        message?: string;
        errors?: string[];
        [key: string]: any;
      }>;

      /**
       * Extract error information
       */
      const status = err.response?.status;
      const errorData = err.response?.data;
      const message =
        errorData?.message ||
        err.message ||
        'An unexpected error occurred';

      /**
       * Development logging
       */
      if (import.meta.env.DEV) {
        console.error('[RTK Query Error]', {
          url,
          method,
          status,
          message,
          data: errorData,
        });
      }

      /**
       * Return error in RTK Query format
       * Note: Toast notifications are handled by Axios interceptors
       */
      return {
        error: {
          status,
          data: errorData,
          message,
        } as ApiError,
      };
    }
  };
};

/**
 * Type helper for extracting error from RTK Query
 *
 * Usage in components:
 * ```typescript
 * if (error) {
 *   const apiError = error as ApiError;
 *   console.log(apiError.message);
 * }
 * ```
 */
export const isApiError = (error: any): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || 'message' in error)
  );
};

export default axiosBaseQuery;
