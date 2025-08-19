import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear the token cookie
    response.cookies.set('token', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
