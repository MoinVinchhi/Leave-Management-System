'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoveLeft, Calendar, Clock, FileText } from 'lucide-react';
import { trackLeaveAction, trackPageView } from '@/lib/analytics';

export default function ApplyLeavePage() {
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [totalDays, setTotalDays] = useState(0);
  const router = useRouter();

  // Available leave types
  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', icon: '🏥' },
    { value: 'vacation', label: 'Vacation Leave', icon: '🏖️' },
    { value: 'personal', label: 'Personal Leave', icon: '👤' },
    { value: 'emergency', label: 'Emergency Leave', icon: '🚨' },
    { value: 'maternity', label: 'Maternity Leave', icon: '👶' },
    { value: 'paternity', label: 'Paternity Leave', icon: '👨‍👶' }
  ];

  // Calculate minimum allowed start date (either today or join date, whichever is later)
  const getMinStartDate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (user?.join_date) {
      const joinDate = new Date(user.join_date).toISOString().split('T')[0];
      return joinDate > today ? joinDate : today;
    }
    return today;
  };

  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/mysql/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          
          // Track page view
          trackPageView('apply_leave', { 
            role: data.user.role,
            user_id: data.user.id 
          });
          
          // Fetch user's leave balance
          const balanceResponse = await fetch('/api/mysql/leave/my-balance', {
            method: 'GET',
            credentials: 'include'
          });

          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            setLeaveBalance(balanceData);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (startDate <= endDate) {
        const diffTime = endDate - startDate;
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setTotalDays(days);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  }, [formData.start_date, formData.end_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation
    if (!formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason.trim()) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Start date cannot be after end date.');
      setLoading(false);
      return;
    }

    if (new Date(formData.start_date) < new Date().setHours(0, 0, 0, 0)) {
      setError('Start date cannot be in the past.');
      setLoading(false);
      return;
    }

    // Check if leave start date is before join date
    if (user?.join_date && new Date(formData.start_date) < new Date(user.join_date)) {
      const joinDateFormatted = new Date(user.join_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
      setError(`Cannot apply for leave before your joining date. Your joining date is ${joinDateFormatted}.`);
      setLoading(false);
      return;
    }

    if (formData.reason.trim().length < 10) {
      setError('Reason must be at least 10 characters long.');
      setLoading(false);
      return;
    }

    // Check leave balance
    if (leaveBalance && formData.leave_type) {
      const leaveTypeKey = `${formData.leave_type}_leave`;
      const availableBalance = leaveBalance.leave_types[leaveTypeKey]?.remaining || 0;
      
      if (totalDays > availableBalance) {
        setError(`Insufficient leave balance. You have ${availableBalance} days remaining for ${formData.leave_type} leave.`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/mysql/leave/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Track successful leave application
        trackLeaveAction('apply', {
          leave_type: formData.leave_type,
          total_days: totalDays,
          user_id: user?.id,
          application_id: data.application_id
        });
        
        setSuccess(`Leave application submitted successfully! Application ID: ${data.application_id}. Your request is now pending approval.`);
        setFormData({
          leave_type: '',
          start_date: '',
          end_date: '',
          reason: ''
        });
        setTotalDays(0);
      } else {
        setError(data.error || 'Failed to submit leave application');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeBalance = (leaveType) => {
    if (!leaveBalance || !leaveType) return null;
    const leaveTypeKey = `${leaveType}_leave`;
    return leaveBalance.leave_types[leaveTypeKey] || null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
              <h1 className="text-xl font-semibold">Apply for Leave</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leave Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                <FileText className="mr-2" />
                Leave Application Form
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type */}
                <div>
                  <label htmlFor="leave_type" className="block text-sm font-medium text-black mb-2">
                    Leave Type *
                  </label>
                  <select
                    id="leave_type"
                    name="leave_type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.leave_type}
                    onChange={handleChange}
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  {formData.leave_type && getLeaveTypeBalance(formData.leave_type) && (
                    <p className="mt-1 text-sm text-gray-600">
                      Available: {getLeaveTypeBalance(formData.leave_type).remaining} days
                      (Total: {getLeaveTypeBalance(formData.leave_type).total}, 
                      Used: {getLeaveTypeBalance(formData.leave_type).used})
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-black mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    required
                    min={getMinStartDate()}
                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.start_date}
                    onChange={handleChange}
                  />
                  {user?.join_date && (
                    <p className="mt-1 text-sm text-gray-500">
                      Note: You joined on {formatDate(user.join_date)}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-black mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    required
                    min={formData.start_date || getMinStartDate()}
                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </div>

                {/* Duration Display */}
                {totalDays > 0 && (
                  <div className="p-4 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-900 flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Duration: {totalDays} day{totalDays !== 1 ? 's' : ''}
                    </p>
                    {formData.start_date && formData.end_date && (
                      <p className="text-sm text-blue-700 mt-1">
                        From {formatDate(formData.start_date)} to {formatDate(formData.end_date)}
                      </p>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-black mb-2">
                    Reason for Leave *
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    required
                    minLength={10}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a detailed reason for your leave request (minimum 10 characters)"
                    value={formData.reason}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.reason.length}/10 characters minimum
                  </p>
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
                    disabled={loading || totalDays === 0}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting Application...' : 'Submit Leave Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Leave Balance Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Calendar className="mr-2" />
                Your Leave Balance
              </h3>
              
              {leaveBalance ? (
                <div className="space-y-4">
                  {leaveTypes.map((type) => {
                    const balance = getLeaveTypeBalance(type.value);
                    if (!balance) return null;
                    
                    const percentage = (balance.remaining / balance.total) * 100;
                    
                    return (
                      <div key={type.value} className="border-b border-gray-200 pb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-black">
                            {type.icon} {type.label}
                          </span>
                          <span className="text-sm text-gray-600">
                            {balance.remaining}/{balance.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 70 ? 'bg-green-500' : 
                              percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(percentage, 0)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Used: {balance.used} days
                        </p>
                      </div>
                    );
                  })}
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600">
                      <strong>Year:</strong> {leaveBalance.year}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Last Updated:</strong> {new Date(leaveBalance.last_updated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>Loading leave balance...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
