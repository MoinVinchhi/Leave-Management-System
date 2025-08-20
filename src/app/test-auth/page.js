'use client';

import { useState } from 'react';

export default function TestAuth() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testCorsAndCookies = async () => {
    setLoading(true);
    const testResults = {};

    try {
      // Test 1: Check if cookies are being sent
      console.log('Testing CORS and Cookie Configuration...');
      
      // Test auth verification
      const authResponse = await fetch('/api/mysql/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      
      testResults.authVerify = {
        status: authResponse.status,
        ok: authResponse.ok,
        headers: Object.fromEntries(authResponse.headers.entries())
      };

      // Test OPTIONS request
      const optionsResponse = await fetch('/api/mysql/auth/verify', {
        method: 'OPTIONS',
        credentials: 'include'
      });
      
      testResults.optionsRequest = {
        status: optionsResponse.status,
        ok: optionsResponse.ok,
        headers: Object.fromEntries(optionsResponse.headers.entries())
      };

      // Test login endpoint
      const loginResponse = await fetch('/api/mysql/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });
      
      testResults.loginTest = {
        status: loginResponse.status,
        ok: loginResponse.ok,
        headers: Object.fromEntries(loginResponse.headers.entries())
      };

      console.log('Test Results:', testResults);
      setResults(testResults);
      
    } catch (error) {
      console.error('Test Error:', error);
      testResults.error = error.message;
      setResults(testResults);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            CORS & Cookie Test Page
          </h1>
          
          <div className="mb-6">
            <button
              onClick={testCorsAndCookies}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test CORS & Cookies'}
            </button>
          </div>

          {Object.keys(results).length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Test Results:</h2>
              
              {results.authVerify && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Auth Verify Test</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Status:</strong> {results.authVerify.status}</p>
                    <p><strong>OK:</strong> {results.authVerify.ok.toString()}</p>
                    <div className="mt-2">
                      <strong>Headers:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(results.authVerify.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {results.optionsRequest && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">OPTIONS Request Test</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Status:</strong> {results.optionsRequest.status}</p>
                    <p><strong>OK:</strong> {results.optionsRequest.ok.toString()}</p>
                    <div className="mt-2">
                      <strong>Headers:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(results.optionsRequest.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {results.loginTest && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Login Test</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Status:</strong> {results.loginTest.status}</p>
                    <p><strong>OK:</strong> {results.loginTest.ok.toString()}</p>
                    <div className="mt-2">
                      <strong>Headers:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(results.loginTest.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {results.error && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-medium text-red-900 mb-2">Error</h3>
                  <p className="text-red-700">{results.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-sm text-gray-600">
            <h3 className="font-medium mb-2">What this test checks:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>CORS headers are properly set on API responses</li>
              <li>OPTIONS preflight requests are handled correctly</li>
              <li>Credentials (cookies) are being sent with requests</li>
              <li>Authentication endpoints respond with proper headers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
