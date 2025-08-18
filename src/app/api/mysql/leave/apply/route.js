import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';

const connectionParams = GetDBSettings();

export async function POST(request) {
  try {
    const body = await request.json();
    const { employee_id, leave_type, start_date, end_date, reason } = body;

    // Validate required fields
    if (!employee_id || !leave_type || !start_date || !end_date || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: employee_id, leave_type, start_date, end_date, reason' 
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

    const connection = await mysql.createConnection(connectionParams);

    // Check if employee exists
    const [employeeCheck] = await connection.execute(
      'SELECT id FROM employees WHERE id = ?',
      [employee_id]
    );

    if (employeeCheck.length === 0) {
      await connection.end();
      return NextResponse.json({ 
        error: 'Employee not found' 
      }, { status: 404 });
    }

    // Insert leave application
    const [result] = await connection.execute(
      `INSERT INTO leave_applications 
       (employee_id, leave_type, start_date, end_date, reason) 
       VALUES (?, ?, ?, ?, ?)`,
      [employee_id, leave_type, start_date, end_date, reason]
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
