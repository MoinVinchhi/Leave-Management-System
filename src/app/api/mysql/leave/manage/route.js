import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';
import { checkUser } from '@/lib/auth/checkUser.js';

const connectionParams = GetDBSettings();

// GET: Fetch all leave requests for HR to manage
export async function GET(request) {
  const auth = await checkUser(request);
  if (auth.error) {
    return NextResponse.json(auth.error, { status: auth.status });
  }

  try {
    // Check if user is HR
    if (auth.data.role !== 'hr') {
      return NextResponse.json({ 
        error: 'Forbidden: Only HR can access this resource' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const connection = await mysql.createConnection(connectionParams);

    let query = `
      SELECT 
        la.id,
        la.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        u.email as employee_email,
        u.department,
        la.leave_type,
        la.start_date,
        la.end_date,
        la.total_days,
        la.reason,
        la.status,
        la.created_at as applied_date,
        la.approved_by,
        la.approved_at,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
      FROM leave_applications la
      JOIN users u ON la.user_id = u.id
      LEFT JOIN users approver ON la.approved_by = approver.id
    `;

    const conditions = [];
    const values = [];

    if (status) {
      conditions.push('la.status = ?');
      values.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY la.created_at DESC';

    const [results] = await connection.execute(query, values);

    await connection.end();

    return NextResponse.json({ 
      results,
      count: results.length 
    });

  } catch (err) {
    console.log("Error: Leave Management API - " + err.message);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}

// PUT: Approve or reject leave request
export async function PUT(request) {
  const auth = await checkUser(request);
  if (auth.error) {
    return NextResponse.json(auth.error, { status: auth.status });
  }

  try {
    // Check if user is HR
    if (auth.data.role !== 'hr') {
      return NextResponse.json({ 
        error: 'Forbidden: Only HR can manage leave requests' 
      }, { status: 403 });
    }

    const { leave_id, action, reason } = await request.json();

    if (!leave_id || !action) {
      return NextResponse.json({ 
        error: 'Leave ID and action are required' 
      }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be either "approved" or "rejected"' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(connectionParams);

    // First check if the leave request exists and is pending
    const [leaveCheck] = await connection.execute(
      'SELECT id, status, user_id FROM leave_applications WHERE id = ?',
      [leave_id]
    );

    if (leaveCheck.length === 0) {
      await connection.end();
      return NextResponse.json({ 
        error: 'Leave request not found' 
      }, { status: 404 });
    }

    if (leaveCheck[0].status !== 'pending') {
      await connection.end();
      return NextResponse.json({ 
        error: 'Leave request has already been processed' 
      }, { status: 400 });
    }

    // Update the leave request
    const updateQuery = `
      UPDATE leave_applications 
      SET status = ?, approved_by = ?, approved_at = NOW()
      WHERE id = ?
    `;

    await connection.execute(updateQuery, [action, auth.data.id, leave_id]);

    // Get the updated leave request details
    const [updatedLeave] = await connection.execute(`
      SELECT 
        la.id,
        la.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        la.leave_type,
        la.start_date,
        la.end_date,
        la.total_days,
        la.reason,
        la.status,
        la.approved_at,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
      FROM leave_applications la
      JOIN users u ON la.user_id = u.id
      LEFT JOIN users approver ON la.approved_by = approver.id
      WHERE la.id = ?
    `, [leave_id]);

    await connection.end();

    return NextResponse.json({ 
      message: `Leave request ${action} successfully`,
      leave_request: updatedLeave[0]
    });

  } catch (err) {
    console.log("Error: Leave Management Update API - " + err.message);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}
