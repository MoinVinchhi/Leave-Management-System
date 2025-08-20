'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoveLeft, FileText, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function MyLeaveApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter]);

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

        // Fetch user's leave applications
        const applicationsResponse = await fetch('/api/mysql/leave/my-applications', {
          method: 'GET',
          credentials: 'include'
        });

        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setApplications(applicationsData.results);
        } else {
          const errorData = await applicationsResponse.json();
          setError(errorData.error || 'Failed to fetch leave applications');
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

  const filterApplications = () => {
    if (statusFilter === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status === statusFilter));
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveTypeIcon = (leaveType) => {
    const icons = {
      sick: '🏥',
      vacation: '🏖️',
      personal: '👤',
      emergency: '🚨',
      maternity: '👶',
      paternity: '👨‍👶'
    };
    return icons[leaveType] || '📄';
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
        <div className="text-xl">Loading your leave applications...</div>
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
              <h1 className="text-xl font-semibold">My Leave Applications</h1>
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
        {/* Header and Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-black">My Leave Applications</h2>
            <p className="text-gray-600 mt-1">View and track all your leave requests</p>
          </div>
          <button
            onClick={() => router.push('/apply-leave')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            Apply New Leave
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total: {applications.length} applications
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Applications List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-2 text-sm font-medium text-black">No leave applications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? 'You haven\'t submitted any leave applications yet.' 
                  : `No ${statusFilter} leave applications found.`
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/apply-leave')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Apply for Leave
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <li key={application.id} className="px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Application Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {getLeaveTypeIcon(application.leave_type)}
                          </span>
                          <div>
                            <p className="text-lg font-medium text-black capitalize">
                              {application.leave_type} Leave
                            </p>
                            <p className="text-sm text-gray-500">
                              Application #{application.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(application.status)}
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Duration</p>
                            <p className="text-sm text-black">
                              {formatDate(application.start_date)} - {formatDate(application.end_date)}
                            </p>
                            <p className="text-xs text-gray-500">{application.total_days} days</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Applied Date</p>
                            <p className="text-sm text-black">{formatDate(application.applied_date)}</p>
                          </div>
                        </div>
                        {application.approved_by_name && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                {application.status === 'approved' ? 'Approved by' : 'Rejected by'}
                              </p>
                              <p className="text-sm text-black">{application.approved_by_name}</p>
                              <p className="text-xs text-gray-500">{formatDate(application.approved_at)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reason */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">Reason</p>
                        <p className="text-sm text-black bg-gray-50 p-3 rounded-md">
                          {application.reason}
                        </p>
                      </div>

                      {/* Status-specific Information */}
                      {application.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <div className="flex">
                            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                Pending Approval
                              </p>
                              <p className="text-sm text-yellow-700">
                                Your leave application is waiting for HR approval.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {application.status === 'approved' && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex">
                            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Application Approved
                              </p>
                              <p className="text-sm text-green-700">
                                Your leave has been approved. Enjoy your time off!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {application.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="flex">
                            <XCircle className="h-5 w-5 text-red-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-red-800">
                                Application Rejected
                              </p>
                              <p className="text-sm text-red-700">
                                Your leave application was not approved. Please contact HR for more details.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary Statistics */}
        {applications.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
              <p className="text-sm text-gray-600">Total Applications</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-red-600">
                {applications.filter(app => app.status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
