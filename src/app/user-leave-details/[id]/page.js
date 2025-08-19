'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function UserLeaveDetailsPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

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
        if (authData.user.role !== 'hr') {
          router.push('/dashboard');
          return;
        }
        setUser(authData.user);

        // Fetch user leave details
        const userResponse = await fetch(`/api/mysql/users/${userId}/leave-details`, {
          method: 'GET',
          credentials: 'include'
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUserData(data);
        } else {
          const errorData = await userResponse.json();
          setError(errorData.error || 'Failed to fetch user details');
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const filteredApplications = userData?.leave_applications?.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading user details...</div>
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
                ← Back to Users
              </button>
              <h1 className="text-xl font-semibold">Employee Leave Details</h1>
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
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {userData && (
          <>
            {/* Employee Info Card */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {userData.user.full_name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{userData.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Department</p>
                      <p className="text-sm text-gray-900">{userData.user.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <p className="text-sm text-gray-900 capitalize">{userData.user.role}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Join Date</p>
                      <p className="text-sm text-gray-900">{formatDate(userData.user.join_date)}</p>
                    </div>
                  </div>
                </div>
                <div className="ml-6">
                  <div className="relative">
                    <select
                      onChange={(e) => setShowBalance(e.target.value === 'balance')}
                      className="block appearance-none bg-white border border-gray-300 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="details">Show Details</option>
                      <option value="balance">Show Balance</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{userData.summary.total_applications}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{userData.summary.approved_applications}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{userData.summary.pending_applications}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{userData.summary.rejected_applications}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </div>

            {/* Conditional Content - Balance or Applications */}
            {showBalance ? (
              /* Leave Balance Section */
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Leave Balance for {userData.leave_balance.year}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {Object.entries(userData.leave_balance.leave_types).map(([leaveType, data]) => (
                    <div key={leaveType} className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                        {leaveType.replace('_', ' ')}
                      </h4>
                      
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
                            {data.total > 0 ? ((data.used / data.total) * 100).toFixed(1) : 0}% used
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Balance Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {userData.summary.total_leave_days_used}
                      </p>
                      <p className="text-sm text-gray-600">Total Days Used</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {userData.summary.total_leave_days_remaining}
                      </p>
                      <p className="text-sm text-gray-600">Total Days Remaining</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Leave Applications Section */
              <div className="bg-white shadow-md rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Leave Applications</h3>
                  
                  {/* Tab Navigation */}
                  <div className="mt-4 flex space-x-1">
                    {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          activeTab === tab
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} 
                        ({tab === 'all' ? userData.leave_applications.length : userData.leave_applications.filter(app => app.status === tab).length})
                      </button>
                    ))}
                  </div>
                </div>

                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No leave applications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === 'all' 
                        ? 'No leave applications found for this employee.' 
                        : `No ${activeTab} leave applications found.`
                      }
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredApplications.map((application) => (
                      <li key={application.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900 capitalize">
                                {application.leave_type} Leave
                              </p>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Duration</p>
                                <p className="text-sm text-gray-900">
                                  {formatDate(application.start_date)} - {formatDate(application.end_date)}
                                </p>
                                <p className="text-xs text-gray-500">{application.total_days} days</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Applied Date</p>
                                <p className="text-sm text-gray-900">{formatDate(application.applied_date)}</p>
                              </div>
                              {application.approved_by_name && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500">
                                    {application.status === 'approved' ? 'Approved by' : 'Rejected by'}
                                  </p>
                                  <p className="text-sm text-gray-900">{application.approved_by_name}</p>
                                  <p className="text-xs text-gray-500">{formatDate(application.approved_at)}</p>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-500">Reason</p>
                              <p className="text-sm text-gray-900">{application.reason}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
