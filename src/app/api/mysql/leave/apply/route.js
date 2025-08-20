import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';
import { checkUser } from '@/lib/auth/checkUser.js';

const connectionParams = GetDBSettings();

export async function POST(request) {
  const auth = await checkUser(request);
  if (auth.error) {
    return NextResponse.json(auth.error, { status: auth.status });
  }
  try {
    const body = await request.json();
    const { leave_type, start_date, end_date, reason } = body;

    // Validate required fields
    if (!leave_type || !start_date || !end_date || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate date format and logic
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate > endDate) {
      return NextResponse.json({ 
        error: 'Start date cannot be after end date' 
      }, { status: 400 });
    }

    const diffTime = endDate - startDate;
    const total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const connection = await mysql.createConnection(connectionParams);

    // Check if user exists and get their join date
    const [userCheck] = await connection.execute(
      'SELECT id, join_date FROM users WHERE id = ?',
      [request.data.id]
    );

    if (userCheck.length === 0) {
      await connection.end();
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const userJoinDate = new Date(userCheck[0].join_date);
    
    // Check if leave start date is before join date
    if (startDate < userJoinDate) {
      await connection.end();
      return NextResponse.json({ 
        error: `Cannot apply for leave before your joining date. Your joining date is ${userJoinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.` 
      }, { status: 400 });
    }

    // Insert leave application
    const [result] = await connection.execute(
      `INSERT INTO leave_applications 
       (user_id, leave_type, start_date, end_date, total_days, reason) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [request.data.id, leave_type, start_date, end_date, total_days, reason]
    );

    await connection.end();

    return NextResponse.json({ 
      success: true, 
      application_id: result.insertId,
      message: 'Leave application submitted successfully',
      status: 'pending'
    });

  } catch (err) {
    console.log("Error: Leave Application API - " + err.message);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}
