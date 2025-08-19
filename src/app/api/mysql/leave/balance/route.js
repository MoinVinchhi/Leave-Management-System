import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';

const connectionParams = GetDBSettings();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ 
        error: 'user_id parameter is required' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(connectionParams);

    // Check if user exists
    const [userCheck] = await connection.execute(
      'SELECT id, first_name, last_name FROM users WHERE id = ?',
      [user_id]
    );

    if (userCheck.length === 0) {
      await connection.end();
      return NextResponse.json({ 
        error: 'Employee not found' 
      }, { status: 404 });
    }

    // user_name: `${userCheck[0].first_name} ${userCheck[0].last_name}`

    const currentYear = new Date().getFullYear();

    // Check if leave balance record exists for current year
    let [balanceResult] = await connection.execute(
      'SELECT * FROM leave_balance WHERE user_id = ? AND year = ?',
      [user_id, currentYear]
    );

    // If no record exists for current year, create one with default values
    if (balanceResult.length === 0) {
      await connection.execute(
        `INSERT INTO leave_balance 
         (user_id, year) 
         VALUES (?, ?)`,
        [user_id, currentYear]
      );

      // Fetch the newly created record
      [balanceResult] = await connection.execute(
        'SELECT * FROM leave_balance WHERE user_id = ? AND year = ?',
        [user_id, currentYear]
      );
    }

    const balance = balanceResult[0];

    // Calculate used leave days from leave_applications table
    const [usedLeaveData] = await connection.execute(
      `SELECT 
        leave_type,
        SUM(DATEDIFF(end_date, start_date) + 1) as days_used
       FROM leave_applications 
       WHERE user_id = ? 
         AND status = 'approved' 
         AND YEAR(start_date) = ?
       GROUP BY leave_type`,
      [user_id, currentYear]
    );

    // Update used leave counts
    const usedLeave = {};
    usedLeaveData.forEach(row => {
      usedLeave[row.leave_type] = row.days_used;
    });

    // Update the balance record with actual used leave
    await connection.execute(
      `UPDATE leave_balance SET
        sick_leave_used = ?,
        vacation_leave_used = ?,
        personal_leave_used = ?,
        emergency_leave_used = ?,
        maternity_leave_used = ?,
        paternity_leave_used = ?
       WHERE user_id = ? AND year = ?`,
      [
        usedLeave.sick || 0,
        usedLeave.vacation || 0,
        usedLeave.personal || 0,
        usedLeave.emergency || 0,
        usedLeave.maternity || 0,
        usedLeave.paternity || 0,
        user_id,
        currentYear
      ]
    );

    // Fetch updated balance
    [balanceResult] = await connection.execute(
      'SELECT * FROM leave_balance WHERE user_id = ? AND year = ?',
      [user_id, currentYear]
    );

    const updatedBalance = balanceResult[0];

    await connection.end();

    // Format response
    const leaveBalance = {
      user_id: parseInt(user_id),
      user_name: userCheck[0].name,
      year: currentYear,
      leave_types: {
        sick_leave: {
          total: updatedBalance.sick_leave_total,
          used: updatedBalance.sick_leave_used,
          remaining: updatedBalance.sick_leave_total - updatedBalance.sick_leave_used
        },
        vacation_leave: {
          total: updatedBalance.vacation_leave_total,
          used: updatedBalance.vacation_leave_used,
          remaining: updatedBalance.vacation_leave_total - updatedBalance.vacation_leave_used
        },
        personal_leave: {
          total: updatedBalance.personal_leave_total,
          used: updatedBalance.personal_leave_used,
          remaining: updatedBalance.personal_leave_total - updatedBalance.personal_leave_used
        },
        emergency_leave: {
          total: updatedBalance.emergency_leave_total,
          used: updatedBalance.emergency_leave_used,
          remaining: updatedBalance.emergency_leave_total - updatedBalance.emergency_leave_used
        },
        maternity_leave: {
          total: updatedBalance.maternity_leave_total,
          used: updatedBalance.maternity_leave_used,
          remaining: updatedBalance.maternity_leave_total - updatedBalance.maternity_leave_used
        },
        paternity_leave: {
          total: updatedBalance.paternity_leave_total,
          used: updatedBalance.paternity_leave_used,
          remaining: updatedBalance.paternity_leave_total - updatedBalance.paternity_leave_used
        }
      },
      last_updated: updatedBalance.updated_at
    };

    return NextResponse.json(leaveBalance);

  } catch (err) {
    console.log("Error: Leave Balance API - " + err.message);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}
