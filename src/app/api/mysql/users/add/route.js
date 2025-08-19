import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { GetDBSettings } from '@/sharedCode/common';
import { checkUser } from '@/lib/auth/checkUser.js';
import { validateUser } from '@/lib/validation/user.js';

const connectionParams = GetDBSettings();


export async function POST(request) {
  const auth = await checkUser(request);
  if (auth.error) {
    return NextResponse.json(auth.error, { status: auth.status });
  }
  try {
    // Check if user is HR
    if (request.data.role !== 'hr') {
      const response = {
        error: 'Forbidden: Only HR can access this resource',
        returnedStatus: 403
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();

    // Validate the data
    validateUser(body);

    const { first_name, last_name, email, join_date, department, role } = body;
    
    const connection = await mysql.createConnection(connectionParams);

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const password = `${first_name}.${last_name}.${role}@123`;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, join_date, department, role) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(insertQuery, [
      first_name,
      last_name,
      email,
      hashedPassword,
      join_date,
      department,
      role
    ]);

    // Get the created user
    const [newUser] = await connection.execute(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    await connection.end();
    
    const user = newUser[0];
    
    // Create response
    const reply = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    };
    
    return NextResponse.json({
      user: reply,
      message: 'User Registered Successfully'
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
