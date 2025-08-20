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
    console.log('1', connectionParams);
    
    const connection = await mysql.createConnection(connectionParams);

    console.log('2', connection);

    // Find user by email
    const [users] = await connection.execute(
      'SELECT id, first_name, last_name, email, password, role, join_date FROM users WHERE email = ?',
      [email]
    );

    await connection.end();

    console.log(users);

    if (users.length === 0)
      throw new Error('Invalid Credentials');

    const user = users[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      throw new Error('Invalid Credentials');

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        first_name: user.first_name, 
        last_name: user.last_name,
        join_date: user.join_date
      },
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
      maxAge: 60 * 60 * 1000, // 1 hour
      httpOnly: true, // prevent JS access
      secure: true, // needed for HTTPS
      sameSite: 'None' // allow cross-site cookies
    });

    return response;
  } catch (err) {
    console.log('error', err);
    console.log("Error: Login API - " + err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 401 }
    );
  }
}
