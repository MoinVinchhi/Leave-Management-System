'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoveLeft, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export default function MyLeaveBalancePage() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/mysql/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        setUser(authData.user);

        // Fetch user's leave balance
        const balanceResponse = await fetch('/api/mysql/leave/my-balance', {
          method: 'GET',
          credentials: 'include'
        });

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalance(balanceData);
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

  const getProgressBarColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressBarWidth = (remaining, total) => {
    return `${Math.max((remaining / total) * 100, 0)}%`;
  };

  const getLeaveTypeIcon = (leaveType) => {
    const icons = {
      sick_leave: '🏥',
      vacation_leave: '🏖️',
      personal_leave: '👤',
      emergency_leave: '🚨',
      maternity_leave: '👶',
      paternity_leave: '👨‍👶'
    };
    return icons[leaveType] || '📄';
  };

  const formatLeaveTypeName = (leaveType) => {
    return leaveType.replace('_', ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTotalAllocated = () => {
    if (!balance) return 0;
    return Object.values(balance.leave_types).reduce((sum, type) => sum + type.total, 0);
  };

  const getTotalUsed = () => {
    if (!balance) return 0;
    return Object.values(balance.leave_types).reduce((sum, type) => sum + type.used, 0);
  };

  const getTotalRemaining = () => {
    if (!balance) return 0;
    return Object.values(balance.leave_types).reduce((sum, type) => sum + type.remaining, 0);
  };

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
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading your leave balance...</div>
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
              <h1 className="text-xl font-semibold">My Leave Balance</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome,
                <span className='font-bold'> 
                {" " + user?.first_name?.charAt(0).toUpperCase() + user?.first_name?.slice(1).toLowerCase()} 
                {user?.last_name?.charAt(0).toUpperCase() + user?.last_name?.slice(1).toLowerCase() + " "} 
                ({user?.role?.toUpperCase()})
                </span>
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
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">
            Leave Balance for {balance?.year}
          </h2>
          <p className="text-gray-600">
            Track your leave entitlements and usage throughout the year
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {balance ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Allocated</p>
                    <p className="text-2xl font-bold text-black">{getTotalAllocated()}</p>
                    <p className="text-sm text-gray-600">days this year</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-md">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Used</p>
                    <p className="text-2xl font-bold text-black">{getTotalUsed()}</p>
                    <p className="text-sm text-gray-600">days used</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Remaining</p>
                    <p className="text-2xl font-bold text-black">{getTotalRemaining()}</p>
                    <p className="text-sm text-gray-600">days left</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Leave Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(balance.leave_types).map(([leaveType, data]) => (
                <div key={leaveType} className="bg-white shadow-md rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black flex items-center">
                      <span className="text-2xl mr-2">{getLeaveTypeIcon(leaveType)}</span>
                      {formatLeaveTypeName(leaveType)}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {data.remaining}/{data.total}
                    </span>
                  </div>
                  
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
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getProgressBarColor(data.remaining, data.total)}`}
                          style={{ width: getProgressBarWidth(data.remaining, data.total) }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((data.remaining / data.total) * 100)}% remaining
                      </p>
                    </div>

                    {/* Usage Status */}
                    <div className="mt-3">
                      {data.remaining === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Exhausted
                        </span>
                      ) : data.remaining <= data.total * 0.2 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Low Balance
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <BarChart3 className="mr-2" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/apply-leave')}
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Apply for Leave
                </button>
                <button
                  onClick={() => router.push('/my-leave-applications')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Applications
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Print Balance
                </button>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Important Notes</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Leave balances are updated in real-time when applications are approved</li>
                <li>• Unused leave may or may not carry over to the next year (check company policy)</li>
                <li>• Emergency leave applications are processed immediately</li>
                <li>• Contact HR for any discrepancies in your leave balance</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="mt-2 text-sm font-medium text-black">No leave balance data</h3>
            <p className="mt-1 text-sm text-gray-500">
              No leave balance information is available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
