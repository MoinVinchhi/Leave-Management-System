'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ViewUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Check if user is HR and fetch users
  useEffect(() => {
    const checkAuthAndFetchUsers = async () => {
      try {
        // Check authentication
        const authResponse = await fetch('/api/mysql/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.user.role !== 'hr') {
            router.push('/dashboard');
            return;
          }
          setUser(authData.user);

          // Fetch all users
          const usersResponse = await fetch('/api/mysql/users/all', {
            method: 'GET',
            credentials: 'include'
          });

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData.results || []);
          } else {
            const errorData = await usersResponse.json();
            setError(errorData.error || 'Failed to fetch users');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        setError('Network error. Please try again.');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUsers();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/mysql/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'hr':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'employee':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold">All Users</h1>
            </div>
            <div className="relative inline-block text-left group mt-3">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-md transition"
              >
                {user?.first_name?.charAt(0).toUpperCase() +
                  user?.first_name?.slice(1).toLowerCase()}
              </button>

              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:cursor-pointer hover:bg-red-100 rounded-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Directory</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Users: {users.length}
              </p>
            </div>
            <button
              onClick={() => router.push('/add-user')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New User
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Table */}
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((currentUser) => (
                    <tr key={currentUser.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{currentUser.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {currentUser.first_name} {currentUser.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{currentUser.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {currentUser.department || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(currentUser.role)}`}>
                          {currentUser.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(currentUser.join_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-2.197a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first employee.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/add-user')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Employee
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {employees.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{employees.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Departments</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {new Set(employees.filter(emp => emp.department).map(emp => emp.department)).size}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">HR Users</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {employees.filter(emp => emp.role === 'hr').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
