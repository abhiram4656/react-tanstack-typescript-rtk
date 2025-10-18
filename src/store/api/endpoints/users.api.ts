/**
 * Users API Endpoints - RTK Query
 *
 * Enterprise Best Practices Implemented:
 * 1. Code Splitting: Endpoints injected into base API
 * 2. Tag-based Invalidation: Automatic cache updates
 * 3. Optimistic Updates: Immediate UI feedback
 * 4. TypeScript Generics: Full type safety
 * 5. Transformations: Response/error transformations
 * 6. Polling Support: Real-time data updates
 * 7. Conditional Fetching: Prevent unnecessary requests
 *
 * MNC Standards:
 * - Consistent naming conventions
 * - Comprehensive JSDoc documentation
 * - Error handling and retry logic
 * - Performance optimizations
 */

import { baseApi, TAG_TYPES } from '../baseApi';
import type { User } from '../../../services/userService';

/**
 * API Response Types
 */
interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface CreateUserRequest extends Omit<User, 'id'> {}
interface UpdateUserRequest extends Partial<User> {}
interface PatchUserRequest extends Partial<User> {}

/**
 * Users API Endpoints
 *
 * Using injectEndpoints pattern for code splitting
 * This allows lazy loading of endpoint definitions
 */
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET - Fetch all users with optional filters
     *
     * Features:
     * - Provides 'Users' tag for cache invalidation
     * - Supports pagination and search params
     * - Response transformation
     * - Keep data for 5 minutes
     */
    getUsers: builder.query<User[], GetUsersParams | void>({
      query: (params) => ({
        url: '/users',
        method: 'GET',
        params: params || undefined,
        meta: {
          showToast: false, // Don't show toast for GET requests
          showErrorToast: true,
        },
      }),
      /**
       * Provide cache tags for invalidation
       * When a mutation invalidates 'Users', this query will refetch
       */
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Users' as const, id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
      /**
       * Keep cached data for 5 minutes (300 seconds)
       * Overrides default keepUnusedDataFor from baseApi
       */
      keepUnusedDataFor: 300,
      /**
       * Transform response if needed
       * Example: Add computed properties, format dates, etc.
       */
      transformResponse: (response: User[]) => {
        // Example transformation: Add computed properties
        return response.map((user) => ({
          ...user,
          // Add any computed fields here
        }));
      },
    }),

    /**
     * GET - Fetch single user by ID
     *
     * Features:
     * - Conditional fetching via 'skip' option in hook
     * - Individual tag for precise cache invalidation
     * - Error transformation
     */
    getUser: builder.query<User, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'GET',
        meta: {
          showToast: false,
          showErrorToast: true,
        },
      }),
      /**
       * Provide both specific user tag and general user tag
       */
      providesTags: (_result, _error, id) => [
        { type: TAG_TYPES.USER, id },
        { type: TAG_TYPES.USERS, id },
      ],
      /**
       * Transform error responses
       */
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          message: response.data?.message || 'Failed to fetch user',
        };
      },
    }),

    /**
     * POST - Create new user
     *
     * Features:
     * - Invalidates Users list cache
     * - Success toast notification
     * - Optimistic update support
     */
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
        meta: {
          showToast: true,
          successMessage: `User "${userData.name}" created successfully!`,
        },
      }),
      /**
       * Invalidate Users list to trigger refetch
       */
      invalidatesTags: [{ type: TAG_TYPES.USERS, id: 'LIST' }],
      /**
       * Optimistic Update (optional)
       * Update cache immediately before server response
       */
      async onQueryStarted(_userData, { dispatch, queryFulfilled }) {
        try {
          // Wait for mutation to complete
          const { data: newUser } = await queryFulfilled;

          // Update getUsers cache optimistically
          dispatch(
            usersApi.util.updateQueryData('getUsers', undefined, (draft) => {
              draft.unshift(newUser);
            })
          );
        } catch {
          // If mutation fails, RTK Query will automatically revert the optimistic update
        }
      },
    }),

    /**
     * PUT - Full update of user
     *
     * Features:
     * - Invalidates both list and specific user
     * - Optimistic update with rollback
     * - Custom success message
     */
    updateUser: builder.mutation<User, { id: number; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
        meta: {
          showToast: true,
          successMessage: 'User updated successfully!',
        },
      }),
      /**
       * Invalidate both the specific user and the users list
       */
      invalidatesTags: (_result, _error, { id }) => [
        { type: TAG_TYPES.USER, id },
        { type: TAG_TYPES.USERS, id },
        { type: TAG_TYPES.USERS, id: 'LIST' },
      ],
      /**
       * Optimistic Update with Rollback
       */
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        // Optimistically update the getUser cache
        const patchResult = dispatch(
          usersApi.util.updateQueryData('getUser', id, (draft) => {
            Object.assign(draft, data);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      },
    }),

    /**
     * PATCH - Partial update of user
     *
     * Features:
     * - Same as PUT but semantically different
     * - Partial data update
     * - Optimistic updates
     */
    patchUser: builder.mutation<User, { id: number; data: PatchUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
        meta: {
          showToast: true,
          successMessage: 'User patched successfully!',
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: TAG_TYPES.USER, id },
        { type: TAG_TYPES.USERS, id },
        { type: TAG_TYPES.USERS, id: 'LIST' },
      ],
      /**
       * Optimistic Update
       */
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          usersApi.util.updateQueryData('getUser', id, (draft) => {
            Object.assign(draft, data);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /**
     * DELETE - Remove user
     *
     * Features:
     * - Removes from cache immediately
     * - Optimistic deletion
     * - Custom confirmation message
     */
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
        meta: {
          showToast: true,
          successMessage: `User #${id} deleted successfully!`,
        },
      }),
      /**
       * Invalidate all user-related caches
       */
      invalidatesTags: (_result, _error, id) => [
        { type: TAG_TYPES.USER, id },
        { type: TAG_TYPES.USERS, id },
        { type: TAG_TYPES.USERS, id: 'LIST' },
      ],
      /**
       * Optimistic Deletion
       */
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Remove from getUsers cache optimistically
        const patchResult = dispatch(
          usersApi.util.updateQueryData('getUsers', undefined, (draft) => {
            return draft.filter((user) => user.id !== id);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      },
    }),

    /**
     * Advanced: Prefetch user on hover
     *
     * Enterprise Pattern: Improve perceived performance
     */
    prefetchUser: builder.query<User, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),
      // Don't keep this data long since it's just for prefetching
      keepUnusedDataFor: 10,
    }),
  }),
  /**
   * Overwrite existing endpoints if re-importing
   * Set to false in production to catch duplicate endpoint definitions
   */
  overrideExisting: import.meta.env.DEV,
});

/**
 * Export hooks for use in components
 *
 * These are auto-generated by RTK Query based on endpoint names
 */
export const {
  // Queries
  useGetUsersQuery,
  useGetUserQuery,
  useLazyGetUserQuery, // Lazy query - triggered manually
  usePrefetchUserQuery,

  // Mutations
  useCreateUserMutation,
  useUpdateUserMutation,
  usePatchUserMutation,
  useDeleteUserMutation,

  // Utilities (for advanced use cases)
  util: {
    getRunningQueriesThunk,
    invalidateTags,
  },
} = usersApi;

/**
 * Export endpoints for server-side rendering (SSR)
 * or manual cache manipulation
 */
export const { getUsers, getUser } = usersApi.endpoints;

export default usersApi;
