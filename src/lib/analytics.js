import { track } from '@vercel/analytics';

/**
 * Custom analytics tracking functions for the Leave Management System
 */

// Track user authentication events
export const trackAuth = (action, metadata = {}) => {
  track('auth', {
    action, // 'login', 'logout', 'register'
    ...metadata
  });
};

// Track leave management actions
export const trackLeaveAction = (action, metadata = {}) => {
  track('leave_action', {
    action, // 'apply', 'approve', 'reject', 'view_balance'
    ...metadata
  });
};

// Track user management actions (HR only)
export const trackUserManagement = (action, metadata = {}) => {
  track('user_management', {
    action, // 'add_user', 'view_users', 'view_user_details'
    ...metadata
  });
};

// Track page navigation
export const trackPageView = (page, metadata = {}) => {
  track('page_view', {
    page,
    ...metadata
  });
};

// Track errors
export const trackError = (error, metadata = {}) => {
  track('error', {
    error: error.message || error,
    ...metadata
  });
};

// Track feature usage
export const trackFeatureUsage = (feature, metadata = {}) => {
  track('feature_usage', {
    feature,
    ...metadata
  });
};
