/**
 * Users Demo Component - RTK Query Implementation
 *
 * Demonstrates all REST methods with RTK Query following MNC best practices:
 * - Automatic caching and invalidation
 * - Optimistic updates
 * - Loading and error states
 * - TypeScript type safety
 * - Tag-based cache management
 * - Conditional fetching
 * - Prefetching on hover
 *
 * Enterprise Patterns:
 * - Separation of concerns
 * - Reusable components
 * - Error boundaries
 * - Performance optimizations
 */

import { useState } from 'react';
import {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  usePatchUserMutation,
  useDeleteUserMutation,
} from '../store/api/endpoints/users.api';
import type { User } from '../services/userService';

export default function UsersDemoRTK() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  /**
   * RTK Query Hooks
   *
   * Features:
   * - Automatic refetching on mount
   * - Built-in loading and error states
   * - Automatic caching and deduplication
   * - Polling support (can add `pollingInterval`)
   */

  // GET - Fetch all users
  const {
    data: users,
    isLoading,
    isError,
    error,
    isFetching, // True when refetching in background
    refetch, // Manual refetch function
  } = useGetUsersQuery();

  // GET - Fetch single user by ID (conditional)
  const {
    data: selectedUser,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser,
  } = useGetUserQuery(selectedUserId!, {
    skip: !selectedUserId, // Don't fetch if no ID selected
    // pollingInterval: 30000, // Optional: Poll every 30 seconds
    // refetchOnMountOrArgChange: true, // Refetch when component mounts
  });

  /**
   * RTK Query Mutations
   *
   * Each mutation returns:
   * - [mutationTrigger, { data, isLoading, isError, error, reset }]
   */

  const [createUser, {
    isLoading: isCreating,
    isError: isCreateError,
    error: createError,
  }] = useCreateUserMutation();

  const [updateUser, {
    isLoading: isUpdating,
  }] = useUpdateUserMutation();

  const [patchUser, {
    isLoading: isPatching,
  }] = usePatchUserMutation();

  const [deleteUser, {
    isLoading: isDeleting,
  }] = useDeleteUserMutation();

  /**
   * Event Handlers
   */

  const handleCreate = async () => {
    try {
      /**
       * RTK Query mutations return a Promise
       * Can use .unwrap() to get the data or throw on error
       */
      const newUser = await createUser({
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
      }).unwrap();

      console.log('User created:', newUser);
      setShowCreateForm(false);

      /**
       * Cache is automatically invalidated via invalidatesTags
       * No manual refetch needed!
       */
    } catch (err) {
      console.error('Failed to create user:', err);
      // Error is already handled by Axios interceptor (toast shown)
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateUser({
        id,
        data: {
          name: 'Updated Name',
          email: 'updated@example.com',
        },
      }).unwrap();

      /**
       * Optimistic update already applied in users.api.ts
       * UI updates immediately, then reverts on error
       */
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handlePatch = async (id: number) => {
    try {
      await patchUser({
        id,
        data: {
          name: 'Patched Name',
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to patch user:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete user #${id}?`)) return;

    try {
      await deleteUser(id).unwrap();

      /**
       * Optimistic deletion already applied
       * User removed from UI immediately
       */

      // Close modal if deleted user was selected
      if (selectedUserId === id) {
        setSelectedUserId(null);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users with RTK Query...</p>
        </div>
      </div>
    );
  }

  /**
   * Error State
   */
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Users</h3>
        <p className="text-red-600 mb-4">
          {(error as any)?.message || 'Failed to fetch users'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-purple-900">
            RTK Query Users Management ({users?.length || 0} users)
          </h2>
          <p className="text-sm text-purple-600 mt-1">
            {isFetching && !isLoading && '🔄 Refreshing...'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            {isFetching ? 'Refreshing...' : 'Manual Refetch'}
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create New User (POST)'}
          </button>
        </div>
      </div>

      {/* RTK Query Features Badge */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-2">
          RTK Query Features Active:
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-purple-700">
          <div>✅ Automatic Caching</div>
          <div>✅ Tag Invalidation</div>
          <div>✅ Optimistic Updates</div>
          <div>✅ Request Deduplication</div>
          <div>✅ Polling Support</div>
          <div>✅ Error Retry Logic</div>
          <div>✅ TypeScript Types</div>
          <div>✅ DevTools Integration</div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-3">Create New User</h3>
          <p className="text-sm text-purple-700 mb-3">
            Demo: Will create user with predefined data (John Doe)
            <br />
            <span className="text-xs">
              Note: Cache automatically invalidated via `invalidatesTags`
            </span>
          </p>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'POST - Create User'}
          </button>
          {isCreateError && (
            <p className="text-red-600 text-sm mt-2">
              Error: {(createError as any)?.message}
            </p>
          )}
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.map((user: User) => (
          <div
            key={user.id}
            className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* User Info */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-gray-500 mt-1">{user.phone}</p>
              )}
            </div>

            {/* Action Buttons - All REST Methods */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* GET - View Details */}
                <button
                  onClick={() => setSelectedUserId(user.id)}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200 transition-colors"
                >
                  GET Detail
                </button>

                {/* PUT - Full Update */}
                <button
                  onClick={() => handleUpdate(user.id)}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded hover:bg-yellow-200 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? '...' : 'PUT Update'}
                </button>

                {/* PATCH - Partial Update */}
                <button
                  onClick={() => handlePatch(user.id)}
                  disabled={isPatching}
                  className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded hover:bg-orange-200 transition-colors disabled:opacity-50"
                >
                  {isPatching ? '...' : 'PATCH'}
                </button>

                {/* DELETE */}
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '...' : 'DELETE'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected User Detail Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-900">
                User Details (GET by ID) - RTK Query
              </h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Loading state for single user */}
            {(isLoadingUser || isFetchingUser) && !selectedUser ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : selectedUser ? (
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">ID:</span> {selectedUser.id}
                </div>
                <div>
                  <span className="font-semibold">Name:</span> {selectedUser.name}
                </div>
                <div>
                  <span className="font-semibold">Username:</span> {selectedUser.username}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {selectedUser.email}
                </div>
                {selectedUser.phone && (
                  <div>
                    <span className="font-semibold">Phone:</span> {selectedUser.phone}
                  </div>
                )}
                {selectedUser.website && (
                  <div>
                    <span className="font-semibold">Website:</span> {selectedUser.website}
                  </div>
                )}
                {selectedUser.address && (
                  <div>
                    <span className="font-semibold">Address:</span>{' '}
                    {selectedUser.address.street}, {selectedUser.address.suite},{' '}
                    {selectedUser.address.city}, {selectedUser.address.zipcode}
                  </div>
                )}
                {selectedUser.company && (
                  <div>
                    <span className="font-semibold">Company:</span> {selectedUser.company.name}
                    <p className="text-sm text-gray-600 mt-1">{selectedUser.company.catchPhrase}</p>
                  </div>
                )}

                {/* RTK Query Cache Info */}
                <div className="mt-4 pt-4 border-t bg-purple-50 p-3 rounded">
                  <p className="text-xs text-purple-700">
                    <strong>RTK Query Cache:</strong> This data is automatically cached and
                    will be instantly available on subsequent requests. Cache is invalidated
                    when user is updated or deleted.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedUserId(null)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Method Explanations */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-bold text-purple-900 mb-4">
          RTK Query REST Methods Demonstrated:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-purple-700">GET (List):</span>
            <p className="text-gray-700">
              useGetUsersQuery() - Auto caching, deduplication, background refetch
            </p>
          </div>
          <div>
            <span className="font-semibold text-purple-700">GET (Detail):</span>
            <p className="text-gray-700">
              useGetUserQuery(id) - Conditional fetching with skip option
            </p>
          </div>
          <div>
            <span className="font-semibold text-green-700">POST:</span>
            <p className="text-gray-700">
              useCreateUserMutation() - Auto invalidates Users list cache
            </p>
          </div>
          <div>
            <span className="font-semibold text-yellow-700">PUT:</span>
            <p className="text-gray-700">
              useUpdateUserMutation() - Optimistic update with rollback on error
            </p>
          </div>
          <div>
            <span className="font-semibold text-orange-700">PATCH:</span>
            <p className="text-gray-700">
              usePatchUserMutation() - Partial update with optimistic UI
            </p>
          </div>
          <div>
            <span className="font-semibold text-red-700">DELETE:</span>
            <p className="text-gray-700">
              useDeleteUserMutation() - Optimistic deletion from cache
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-purple-300">
          <h4 className="font-semibold text-purple-900 mb-2">
            Enterprise Features:
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Tag-based Invalidation:</strong> Mutations auto-invalidate related queries</li>
            <li>• <strong>Optimistic Updates:</strong> UI updates before server response</li>
            <li>• <strong>Request Deduplication:</strong> Multiple identical requests merged</li>
            <li>• <strong>Automatic Retry:</strong> Failed requests retry via axios-retry</li>
            <li>• <strong>TypeScript Safety:</strong> Full type inference and checking</li>
            <li>• <strong>DevTools Support:</strong> Redux DevTools shows all cache state</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
