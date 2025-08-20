'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoveLeft } from 'lucide-react';

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    join_date: '',
    department: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Check if user is HR
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/mysql/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user.role !== 'hr') {
            router.push('/dashboard');
          }
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/mysql/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`User created successfully! Password: ${formData.first_name}.${formData.last_name}.${formData.role}@123`);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          join_date: '',
          department: '',
          role: 'employee'
        });
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?\n\nYou will be redirected to the login page and any unsaved changes will be lost."
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await fetch('/api/mysql/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  const toggleMenu = () => setOpen(!open);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                <MoveLeft className='inline' /> Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold">Add New User</h1>
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
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-black mb-6">Add New User</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-black mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                required
                minLength={2}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter first name (2-10 characters)"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-black mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                required
                minLength={2}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter last name (2-10 characters)"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Join Date */}
            <div>
              <label htmlFor="join_date" className="block text-sm font-medium text-black mb-1">
                Join Date *
              </label>
              <input
                type="date"
                id="join_date"
                name="join_date"
                required
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.join_date}
                onChange={handleChange}
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-black mb-1">
                Department *
              </label>
              <select
                id="department"
                name="department"
                required
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="IT">IT</option>
              </select>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-black mb-1">
                Role *
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating User...' : 'Create User'}
              </button>
            </div>
          </form>

          {/* Password Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Password Information</h3>
            <p className="text-sm text-blue-700">
              The system will automatically generate a password in the format: <br />
              <code className="bg-blue-100 px-1 rounded">FirstName.LastName.Role@123</code><br />
              Example: <code className="bg-blue-100 px-1 rounded">John.Doe.employee@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
