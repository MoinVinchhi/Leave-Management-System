import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GetDBSettings } from '@/sharedCode/common';

const connectionParams = GetDBSettings();

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { email, password } = body;

    if (!email || !password) {
      throw new Error('Inavalid Credentials');
    }
    
    const connection = await mysql.createConnection(connectionParams);

    // Find user by email
    const [users] = await connection.execute(
      'SELECT id, first_name, last_name, email, password, role FROM users WHERE email = ?',
      [email]
    );

    await connection.end();

    if (users.length === 0)
      throw new Error('Invalid Credentials');

    const user = users[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      throw new Error('Invalid Credentials');

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const reply = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role
    };

    const response = NextResponse.json({
      user: reply,
      message: 'User Logged In Successfully'
    }, { status: 200 });

    response.cookies.set('token', token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (err) {
    console.log("Error: Login API - " + err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 401 }
    );
  }
}
