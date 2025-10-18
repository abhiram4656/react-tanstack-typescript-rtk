/**
 * Users Demo Component
 * Demonstrates all REST methods (GET, POST, PUT, PATCH, DELETE) with TanStack Query
 */

import { useState } from 'react';
import { useUsers, useUser, useCreateUser, useUpdateUser, usePatchUser, useDeleteUser } from '../hooks/useUsers';
import type { User } from '../services/userService';

export default function UsersDemo() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Queries
  const { data: users, isLoading, isError, error } = useUsers();
  const { data: selectedUser } = useUser(selectedUserId || 0);

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const patchUser = usePatchUser();
  const deleteUser = useDeleteUser();

  // Handlers
  const handleCreate = async () => {
    await createUser.mutateAsync({
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
    });
    setShowCreateForm(false);
  };

  const handleUpdate = async (id: number) => {
    await updateUser.mutateAsync({
      id,
      data: {
        name: 'Updated Name',
        email: 'updated@example.com',
      },
    });
  };

  const handlePatch = async (id: number) => {
    await patchUser.mutateAsync({
      id,
      data: {
        name: 'Patched Name',
      },
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm(`Delete user #${id}?`)) {
      await deleteUser.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Users Management ({users?.length || 0} users)
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create New User (POST)'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">Create New User</h3>
          <p className="text-sm text-green-700 mb-3">
            Demo: Will create user with predefined data (John Doe)
          </p>
          <button
            onClick={handleCreate}
            disabled={createUser.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {createUser.isPending ? 'Creating...' : 'POST - Create User'}
          </button>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.map((user: User) => (
          <div
            key={user.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* User Info */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
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
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
                >
                  GET Detail
                </button>

                {/* PUT - Full Update */}
                <button
                  onClick={() => handleUpdate(user.id)}
                  disabled={updateUser.isPending}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded hover:bg-yellow-200 transition-colors disabled:opacity-50"
                >
                  PUT Update
                </button>

                {/* PATCH - Partial Update */}
                <button
                  onClick={() => handlePatch(user.id)}
                  disabled={patchUser.isPending}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  PATCH
                </button>

                {/* DELETE */}
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={deleteUser.isPending}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected User Detail Modal */}
      {selectedUserId && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                User Details (GET by ID)
              </h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

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
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedUserId(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Method Explanations */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4">REST Methods Demonstrated:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-blue-700">GET (List):</span>
            <p className="text-gray-600">Fetches all users - auto-runs on mount</p>
          </div>
          <div>
            <span className="font-semibold text-blue-700">GET (Detail):</span>
            <p className="text-gray-600">Fetches single user by ID - click "GET Detail"</p>
          </div>
          <div>
            <span className="font-semibold text-green-700">POST:</span>
            <p className="text-gray-600">Creates new user - click "Create New User"</p>
          </div>
          <div>
            <span className="font-semibold text-yellow-700">PUT:</span>
            <p className="text-gray-600">Full update - replaces entire user object</p>
          </div>
          <div>
            <span className="font-semibold text-purple-700">PATCH:</span>
            <p className="text-gray-600">Partial update - updates only specific fields</p>
          </div>
          <div>
            <span className="font-semibold text-red-700">DELETE:</span>
            <p className="text-gray-600">Removes user - requires confirmation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
