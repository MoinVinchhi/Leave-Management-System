import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear the token cookie with same settings as login
    response.cookies.set('token', '', {
      maxAge: 0, // immediately expire
      httpOnly: true, // prevent JS access
      secure: true, // needed for HTTPS
      sameSite: 'None' // allow cross-site cookies
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
