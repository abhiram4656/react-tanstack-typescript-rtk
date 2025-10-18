/**
 * Custom hooks for User operations with TanStack Query
 * Demonstrates all REST methods with proper TypeScript typing
 *
 * Toast notifications are handled at the service layer for consistency
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import type { User } from '../services/userService';
import { queryKeys } from '../lib/api/query-client.config';

/**
 * GET - Fetch all users
 */
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.user.all,
    queryFn: () => userService.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * GET - Fetch single user by ID
 */
export const useUser = (id: number) => {
  return useQuery({
    queryKey: queryKeys.user.byId(String(id)),
    queryFn: () => userService.getUserById(id),
    enabled: !!id, // Only run if ID exists
  });
};

/**
 * POST - Create new user
 * Toast notification handled in userService.createUser()
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Omit<User, 'id'>) => userService.createUser(userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
};

/**
 * PUT - Update entire user
 * Toast notification handled in userService.updateUser()
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      userService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.byId(String(updatedUser.id)) });
    },
  });
};

/**
 * PATCH - Partial update user
 * Toast notification handled in userService.patchUser()
 */
export const usePatchUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      userService.patchUser(id, data),
    onSuccess: (patchedUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.byId(String(patchedUser.id)) });
    },
  });
};

/**
 * DELETE - Remove user
 * Toast notification handled in userService.deleteUser()
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      queryClient.removeQueries({ queryKey: queryKeys.user.byId(String(deletedId)) });
    },
  });
};
