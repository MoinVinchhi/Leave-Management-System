import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return NextResponse.json({ 
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        first_name: decoded.first_name,
        last_name: decoded.last_name
      } 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
