'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoveLeft } from 'lucide-react'
import { trackLeaveAction, trackPageView } from '@/lib/analytics'

export default function ManageLeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionModal, setActionModal] = useState({ show: false, request: null });
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, statusFilter]);

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

        // Track page view
        trackPageView('manage_leave_requests', { 
          role: authData.user.role,
          user_id: authData.user.id 
        });

        // Fetch leave requests
        const requestsResponse = await fetch('/api/mysql/leave/manage', {
          method: 'GET',
          credentials: 'include'
        });

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setLeaveRequests(requestsData.results);
        } else {
          const errorData = await requestsResponse.json();
          setError(errorData.error || 'Failed to fetch leave requests');
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

  const filterRequests = () => {
    if (statusFilter === 'all') {
      setFilteredRequests(leaveRequests);
    } else {
      setFilteredRequests(leaveRequests.filter(req => req.status === statusFilter));
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

  const openActionModal = (request) => {
    setActionModal({ show: true, request });
  };

  const closeActionModal = () => {
    setActionModal({ show: false, request: null });
  };

  const handleLeaveAction = async (action) => {
    if (!actionModal.request) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/mysql/leave/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          leave_id: actionModal.request.id,
          action: action
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Track leave action
        trackLeaveAction(action, {
          leave_id: actionModal.request.id,
          leave_type: actionModal.request.leave_type,
          total_days: actionModal.request.total_days,
          hr_user_id: user.id,
          applicant_id: actionModal.request.employee_id || actionModal.request.user_id
        });
        
        // Update the local state
        setLeaveRequests(prev => prev.map(req => 
          req.id === actionModal.request.id 
            ? { ...req, status: action, approved_by_name: user.first_name + ' ' + user.last_name, approved_at: new Date().toISOString() }
            : req
        ));

        closeActionModal();
        
        // Show success message
        alert(`Leave request ${action} successfully!`);
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.error || 'Failed to process request'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading leave requests...</div>
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
              <h1 className="text-xl font-semibold">Manage Leave Requests</h1>
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
        {/* Filter Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total: {filteredRequests.length} requests
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Leave Requests Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Leave Requests
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage and process user leave requests
            </p>
          </div>
          
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? 'No leave requests found.' 
                  : `No ${statusFilter} leave requests found.`
                }
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <li key={request.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {request.employee_name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">📧</span>
                            {request.employee_email}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <span className="mr-2">🏢</span>
                            {request.department || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Leave Type</p>
                          <p className="text-sm text-gray-600 capitalize">{request.leave_type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Duration</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
                            <span className="ml-2 text-xs text-gray-500">({request.total_days} days)</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Applied Date</p>
                          <p className="text-sm text-gray-600">{formatDate(request.applied_date)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900">Reason</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>
                      {request.status !== 'pending' && request.approved_by_name && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">
                            {request.status === 'approved' ? 'Approved' : 'Rejected'} by
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.approved_by_name} on {formatDate(request.approved_at)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-6 flex-shrink-0 self-start">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => openActionModal(request)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Take Action
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Take Action on Leave Request
              </h3>
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">{actionModal.request?.employee_name}</p>
                <p className="text-sm text-gray-600 capitalize">{actionModal.request?.leave_type} Leave</p>
                <p className="text-sm text-gray-600">
                  {actionModal.request && formatDate(actionModal.request.start_date)} - {actionModal.request && formatDate(actionModal.request.end_date)}
                </p>
                <p className="text-sm text-gray-600 mt-2">{actionModal.request?.reason}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleLeaveAction('approved')}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleLeaveAction('rejected')}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
              <div className="mt-4">
                <button
                  onClick={closeActionModal}
                  disabled={actionLoading}
                  className="w-full bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
