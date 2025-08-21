'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackAuth, trackPageView } from '@/lib/analytics';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by verifying the token
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/mysql/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Track dashboard access
          trackPageView('dashboard', { 
            role: data.user.role,
            user_id: data.user.id 
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?\n\nYou will be redirected to the login page."
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await fetch('/api/mysql/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      // Track logout
      trackAuth('logout', { 
        role: user?.role,
        user_id: user?.id 
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Leave Management System</h1>
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            
            {user?.role === 'hr' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Add User</h3>
                  <p className="text-black mb-4">Add new users to the system</p>
                  <button 
                    onClick={() => router.push('/add-user')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Add User
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">View All Users</h3>
                  <p className="text-black mb-4">Manage all users and view leave details</p>
                  <button 
                    onClick={() => router.push('/view-users')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    View Users
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Leave Requests</h3>
                  <p className="text-black mb-4">Approve/Reject leave requests</p>
                  <button 
                    onClick={() => router.push('/manage-leave-requests')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                  >
                    Manage Leaves
                  </button>
                </div>
              </div>
            )}

            {user?.role === 'employee' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Apply for Leave</h3>
                  <p className="text-black mb-4">Submit a new leave request</p>
                  <button 
                    onClick={() => router.push('/apply-leave')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Apply Leave
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">My Leave Balance</h3>
                  <p className="text-black mb-4">Check your leave balance</p>
                  <button 
                    onClick={() => router.push('/my-leave-balance')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    View Balance
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
