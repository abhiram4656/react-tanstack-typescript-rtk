/**
 * User Service - API endpoints with best practices
 *
 * Demonstrates clean API calling patterns:
 * - Separation of body, params, and path parameters
 * - Toast control per endpoint
 * - TypeScript type safety
 * - Scalable structure
 */

import httpService, { buildEndpoint } from '../lib/api/http.service';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  company?: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

const API_BASE = 'https://jsonplaceholder.typicode.com';

export const userService = {
  /**
   * GET - Fetch all users
   * @param params - Query parameters (pagination, filters, etc.)
   */
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const response = await httpService.get<User[]>(`${API_BASE}/users`, {
      params,
      config: {
        showSuccessToast: false, // Don't show toast for GET requests
        showErrorToast: true,    // Show error toast
      },
    });
    return response.data;
  },

  /**
   * GET - Fetch single user by ID
   * @param id - User ID
   */
  async getUserById(id: number) {
    // Method 1: Direct ID in endpoint
    const response = await httpService.get<User>(`${API_BASE}/users/${id}`, {
      config: {
        showSuccessToast: false,
      },
    });
    return response.data;

    // Method 2: Using buildEndpoint helper (for complex URLs)
    // const endpoint = buildEndpoint(`${API_BASE}/users/:id`, { id });
    // const response = await httpService.get<User>(endpoint);
    // return response.data;
  },

  /**
   * POST - Create new user
   * @param userData - User data to create
   */
  async createUser(userData: Omit<User, 'id'>) {
    const response = await httpService.post<User>(`${API_BASE}/users`, {
      body: userData,
      config: {
        showSuccessToast: true,
        successMessage: `User "${userData.name}" created successfully!`,
      },
    });
    return response.data;
  },

  /**
   * PUT - Full update of user
   * @param id - User ID
   * @param userData - Complete user data
   */
  async updateUser(id: number, userData: Partial<User>) {
    const response = await httpService.put<User>(`${API_BASE}/users/${id}`, {
      body: userData,
      config: {
        showSuccessToast: true,
        successMessage: 'User updated successfully!',
      },
    });
    return response.data;
  },

  /**
   * PATCH - Partial update of user
   * @param id - User ID
   * @param userData - Partial user data to update
   */
  async patchUser(id: number, userData: Partial<User>) {
    const response = await httpService.patch<User>(`${API_BASE}/users/${id}`, {
      body: userData,
      config: {
        showSuccessToast: true,
        successMessage: 'User patched successfully!',
      },
    });
    return response.data;
  },

  /**
   * DELETE - Remove user
   * @param id - User ID
   */
  async deleteUser(id: number) {
    const response = await httpService.delete(`${API_BASE}/users/${id}`, {
      config: {
        showSuccessToast: true,
        successMessage: `User #${id} deleted successfully!`,
      },
    });
    return response.data;
  },

  /**
   * Example: Complex query with both path params and query params
   * GET /users/:userId/posts?status=published&limit=10
   */
  async getUserPosts(userId: number, params?: { status?: string; limit?: number }) {
    const endpoint = buildEndpoint(`${API_BASE}/users/:userId/posts`, { userId });

    const response = await httpService.get(endpoint, {
      params,
      config: {
        showSuccessToast: false,
      },
    });
    return response.data;
  },

  /**
   * Example: Silent operation (no toasts)
   * Useful for background operations or polling
   */
  async checkUserStatus(id: number) {
    const response = await httpService.get<{ online: boolean }>(`${API_BASE}/users/${id}/status`, {
      config: {
        showSuccessToast: false,
        showErrorToast: false, // Silent mode - no error toasts
      },
    });
    return response.data;
  },
};
