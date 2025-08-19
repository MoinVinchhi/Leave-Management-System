'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LeaveBalancePage() {
  const [balance, setBalance] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id;

  useEffect(() => {
    const fetchData = async () => {
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

          // Fetch leave balance using dynamic route parameter
          const balanceResponse = await fetch(`/api/mysql/leave/balance/${employeeId}`, {
            method: 'GET',
            credentials: 'include'
          });

          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            setBalance(balanceData);
            setEmployee({
              id: balanceData.employee_id,
              name: balanceData.employee_name
            });
          } else {
            const errorData = await balanceResponse.json();
            setError(errorData.error || 'Failed to fetch leave balance');
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

    if (employeeId) {
      fetchData();
    }
  }, [employeeId, router]);

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

  const getProgressBarColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressBarWidth = (remaining, total) => {
    return `${Math.max((remaining / total) * 100, 0)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading leave balance...</div>
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
                onClick={() => router.push('/view-users')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Employees
              </button>
              <h1 className="text-xl font-semibold">Leave Balance</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.first_name} {user?.last_name} ({user?.role})
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Employee Info Card */}
        {employee && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {employee.name}
            </h2>
            <p className="text-gray-600">Employee ID: #{employee.id}</p>
            <p className="text-gray-600">Leave Balance for Year: {balance?.year}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Leave Balance Cards */}
        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(balance.leave_types).map(([leaveType, data]) => (
              <div key={leaveType} className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {leaveType.replace('_', ' ')}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Allocated</span>
                    <span className="font-medium">{data.total} days</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used</span>
                    <span className="font-medium text-red-600">{data.used} days</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-medium text-green-600">{data.remaining} days</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Available</span>
                      <span>{data.remaining}/{data.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(data.remaining, data.total)}`}
                        style={{ width: getProgressBarWidth(data.remaining, data.total) }}
                      ></div>
                    </div>
                  </div>

                  {/* Usage Percentage */}
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-500">
                      {((data.used / data.total) * 100).toFixed(1)}% used
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {balance && (
          <div className="mt-8 bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(balance.leave_types).reduce((sum, leave) => sum + leave.total, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Leave Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(balance.leave_types).reduce((sum, leave) => sum + leave.used, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Used</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(balance.leave_types).reduce((sum, leave) => sum + leave.remaining, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Remaining</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Last updated: {balance.last_updated ? new Date(balance.last_updated).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!balance && !loading && !error && (
          <div className="bg-white shadow-md rounded-lg p-12 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leave balance data</h3>
              <p className="mt-1 text-sm text-gray-500">
                No leave balance information is available for this employee.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
