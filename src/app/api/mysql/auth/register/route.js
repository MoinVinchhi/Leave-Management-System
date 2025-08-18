import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GetDBSettings } from '@/sharedCode/common';
import validator from 'validator';

const connectionParams = GetDBSettings();

const validate = (data) => {
  const mandatoryFields = ['first_name', 'last_name', 'email', 'password'];
  
  const isAllowed = mandatoryFields.every((k) => Object.keys(data).includes(k));

  if (!isAllowed) 
    throw new Error('Mandatory Field(s) Missing');

  if (!validator.isEmail(data.email))
    throw new Error('Invalid Email');

  if (data.password.length < 4)
    throw new Error('Weak Password (minimum length should be 4)');

  if (data.first_name.length < 2 || data.first_name.length > 10) 
    throw new Error("Firstname's Length Is Invalid");

  if (data.last_name.length < 2 || data.last_name.length > 10) 
    throw new Error("Lastname's Length Is Invalid");
};

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate the data
    validate(body);
    
    const { first_name, last_name, email, password } = body;
    
    const connection = await mysql.createConnection(connectionParams);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        join_date DATE NOT NULL,
        department VARCHAR(100),
        role VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createTableQuery);
    
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
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, join_date, department, role) 
      VALUES (?, ?, ?, ?, ?, ?, 'HR')
    `;

    const currDate = new Date();
    
    const [result] = await connection.execute(insertQuery, [
      first_name,
      last_name,
      email,
      hashedPassword,
      currDate,
      'HR'
    ]);
    
    // Get the created user
    const [newUser] = await connection.execute(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    await connection.end();
    
    const user = newUser[0];
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_KEY || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    // Create response
    const reply = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    };
    
    // Create response with cookie
    const response = NextResponse.json({
      user: reply,
      message: 'User Registered Successfully'
    }, { status: 201 });
    
    // Set cookie
    response.cookies.set('token', token, {
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
    
  } catch (err) {
    console.log("Error: Register API - " + err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}