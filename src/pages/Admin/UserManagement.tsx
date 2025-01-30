import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  Edit,
  UserX,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getUsers,
  updateUserStatus,
  softDeleteUser,
  updateUserProfile,
} from '../../lib/user';
import type { Profile, UserFilters, UserSort, UserStatus } from '../../types/user';

export function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [sort, setSort] = useState<UserSort>({ field: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { users: fetchedUsers, total } = await getUsers(filters, sort, page);
      setUsers(fetchedUsers);
      setTotalUsers(total);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters, sort, page]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      setActionInProgress(true);
      await updateUserStatus(userId, status, user!.id);
      await fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating status:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setActionInProgress(true);
      await softDeleteUser(userId, user!.id);
      await fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'suspend' | 'activate') => {
    if (!confirm(`Are you sure you want to ${action} the selected users?`)) return;

    try {
      setActionInProgress(true);
      const status = action === 'suspend' ? 'suspended' : action === 'activate' ? 'active' : undefined;

      for (const userId of selectedUsers) {
        if (status) {
          await updateUserStatus(userId, status as UserStatus, user!.id);
        } else if (action === 'delete') {
          await softDeleteUser(userId, user!.id);
        }
      }

      setSelectedUsers([]);
      await fetchUsers();
    } catch (err) {
      setError(`Failed to ${action} users`);
      console.error(`Error performing bulk ${action}:`, err);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="w-6 h-6 mr-2" />
          User Management
        </h1>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {selectedUsers.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={actionInProgress}
                className="px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                disabled={actionInProgress}
                className="px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={actionInProgress}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={(e) => {
                    setSelectedUsers(
                      e.target.checked ? users.map((u) => u.id) : []
                    );
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      setSelectedUsers(
                        e.target.checked
                          ? [...selectedUsers, user.id]
                          : selectedUsers.filter((id) => id !== user.id)
                      );
                    }}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500">{user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'suspended'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                      disabled={actionInProgress}
                      className={`p-1 rounded-full ${
                        user.status === 'active'
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {user.status === 'active' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={actionInProgress}
                      className="p-1 text-red-600 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="p-1 text-gray-400 rounded-full hover:bg-gray-50">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalUsers)} of{' '}
          {totalUsers} users
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page * 10 >= totalUsers}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}