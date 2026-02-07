import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight, Ban, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import { getAdminUsers, deleteUserAdmin, updateUserAdmin } from '../services/adminApi';

const UserStatusCell = ({ isActive }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${
      isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}
  >
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

const UserRoleCell = ({ user, isEditing, onUpdate, onCancel }) => {
  if (isEditing) {
    return (
      <select
        defaultValue={user.role}
        onChange={(e) => onUpdate(user.id, e.target.value)}
        className="text-sm border rounded p-1"
        autoFocus
        onBlur={onCancel}
      >
        <option value="user">User</option>
        <option value="doctor">Doctor</option>
        <option value="admin">Admin</option>
      </select>
    );
  }
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        user.role === 'admin'
          ? 'bg-purple-100 text-purple-700'
          : user.role === 'doctor'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
      }`}
    >
      {user.role}
    </span>
  );
};

const UserActionButtons = ({ user, onEdit, onDelete, onToggleStatus }) => (
  <>
    <button
      onClick={() => onEdit(user.id)}
      className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
      title="Edit Role"
    >
      <Edit2 className="w-5 h-5 max-[460px]:w-4 max-[460px]:h-4" />
      <span className="max-[460px]:hidden">Edit Role</span>
    </button>

    <button
      onClick={() => onToggleStatus(user.id, !user.is_active, user.name)}
      className={`${
        user.is_active
          ? 'text-orange-600 hover:text-orange-800'
          : 'text-green-600 hover:text-green-800'
      } text-sm font-medium inline-flex items-center gap-1`}
      title={user.is_active ? 'Ban User' : 'Unban User'}
    >
      {user.is_active ? (
        <>
          <Ban className="w-5 h-5 max-[460px]:w-4 max-[460px]:h-4" />
          <span className="max-[460px]:hidden">Ban User</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-5 h-5 max-[460px]:w-4 max-[460px]:h-4" />
          <span className="max-[460px]:hidden">Unban User</span>
        </>
      )}
    </button>

    <button
      onClick={() => onDelete(user.id, user.name)}
      className="text-red-600 hover:text-red-800 text-sm font-medium inline-flex items-center gap-1"
      title="Delete User"
    >
      <Trash2 className="w-5 h-5 max-[460px]:w-4 max-[460px]:h-4" />
      <span className="max-[460px]:hidden">Delete</span>
    </button>
  </>
);

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingUser, setEditingUser] = useState(null); // User being edited

  const { notify } = useNotifications();

  const pageSize = 10;

  const fetchUsers = async (query = searchTerm) => {
    setLoading(true);
    const result = await getAdminUsers(page, pageSize, query, roleFilter);
    if (result.success) {
      setUsers(result.data.users);
      setTotalUsers(result.data.total);
      setTotalPages(Math.ceil(result.data.total / pageSize));
    } else {
      notify({ type: 'error', title: 'Error', message: result.error });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]); // Refetch when page or filter changes

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchUsers(searchTerm);
  };

  const handleDelete = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    const result = await deleteUserAdmin(userId);
    if (result.success) {
      notify({ type: 'success', title: 'Success', message: 'User deleted successfully' });
      fetchUsers(); // Refresh list
    } else {
      notify({ type: 'error', title: 'Error', message: result.error });
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const result = await updateUserAdmin(userId, { role: newRole });
    if (result.success) {
      notify({ type: 'success', title: 'Success', message: 'User role updated' });
      setEditingUser(null);
      fetchUsers(); // Refresh list
    } else {
      notify({ type: 'error', title: 'Error', message: result.error });
    }
  };

  const handleToggleStatus = async (userId, newStatus, userName) => {
    const action = newStatus ? 'activate' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
      return;
    }

    const result = await updateUserAdmin(userId, { is_active: newStatus });
    if (result.success) {
      notify({ type: 'success', title: 'Success', message: `User ${action}d successfully` });
      fetchUsers(); // Refresh list
    } else {
      notify({ type: 'error', title: 'Error', message: result.error });
    }
  };

  return (
    <div className="min-h-screen bg-medical-light">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-medical-dark">Admin Dashboard</h1>
          </div>
          <div className="text-sm text-gray-500">Total Users: {totalUsers}</div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-medical mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-medical w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-medical w-full"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn-medical-primary whitespace-nowrap flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-medical">
          {loading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="max-md:hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-medical-gray-100 text-medical-gray-600 uppercase text-sm font-semibold">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-medical-gray-200">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-medical-gray-50 transition-colors">
                          <td className="p-4 font-medium text-medical-dark">{user.name}</td>
                          <td className="p-4 text-gray-600 break-all">{user.email}</td>
                          <td className="p-4">
                            <UserRoleCell
                              user={user}
                              isEditing={editingUser === user.id}
                              onUpdate={handleUpdateRole}
                              onCancel={() => setEditingUser(null)}
                            />
                          </td>
                          <td className="p-4">
                            <UserStatusCell isActive={user.is_active} />
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {user.last_login
                              ? new Date(user.last_login).toLocaleDateString() +
                                ' ' +
                                new Date(user.last_login).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              <UserActionButtons
                                user={user}
                                onEdit={setEditingUser}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4 bg-gray-50">
                {users.length > 0 ? (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-medical-dark">{user.name}</h3>
                          <p className="text-sm text-gray-500 break-all">{user.email}</p>
                        </div>
                        <UserRoleCell
                          user={user}
                          isEditing={editingUser === user.id}
                          onUpdate={handleUpdateRole}
                          onCancel={() => setEditingUser(null)}
                        />
                      </div>

                      <div className="mb-3 flex justify-between items-center">
                        <UserStatusCell isActive={user.is_active} />
                        <span className="text-xs text-gray-500">
                          Last:{' '}
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </span>
                        <div className="flex gap-3 flex-wrap justify-end">
                          <UserActionButtons
                            user={user}
                            onEdit={setEditingUser}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">No users found.</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white shadow-sm disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="px-4 py-2 flex items-center">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white shadow-sm disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
