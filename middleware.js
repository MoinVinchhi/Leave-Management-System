import { NextResponse } from 'next/server';

export function middleware(request) {
  const origin = request.headers.get('origin');
  
  // Allowed origins
  const allowedOrigins = [
    'https://leave-management-system-drab.vercel.app',
    'http://localhost:3000',
  ];

  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
  }

  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
      },
    });
  }

  return response;
}

// Configure middleware for API routes
export const config = {
  matcher: ['/api/:path*'],
};
