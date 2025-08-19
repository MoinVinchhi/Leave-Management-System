'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  console.log(user);

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
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.firstName} {user?.lastName} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
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
                  <h3 className="text-lg font-medium mb-2">Add Employee</h3>
                  <p className="text-gray-600 mb-4">Add new employees to the system</p>
                  <button 
                    onClick={() => router.push('/add-user')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Add Employee
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">View All Users</h3>
                  <p className="text-gray-600 mb-4">Manage all users and view leave details</p>
                  <button 
                    onClick={() => router.push('/view-users')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    View Users
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Leave Requests</h3>
                  <p className="text-gray-600 mb-4">Approve/Reject leave requests</p>
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
                  <p className="text-gray-600 mb-4">Submit a new leave request</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    Apply Leave
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">My Leave Balance</h3>
                  <p className="text-gray-600 mb-4">Check your leave balance</p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
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
