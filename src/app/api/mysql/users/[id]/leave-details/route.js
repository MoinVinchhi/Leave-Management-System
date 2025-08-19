import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';
import { checkUser } from '@/lib/auth/checkUser.js';

const connectionParams = GetDBSettings();

export async function GET(request, { params }) {
  const auth = await checkUser(request);
  if (auth.error) {
    return NextResponse.json(auth.error, { status: auth.status });
  }

  try {
    // Check if user is HR
    if (request?.data?.role !== 'hr') {
      return NextResponse.json({ 
        error: 'Forbidden: Only HR can access this resource' 
      }, { status: 403 });
    }

    const user_id = params.id;

    if (!user_id) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(connectionParams);

    // Get user basic information
    const [userResult] = await connection.execute(
      `SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        join_date, 
        department, 
        role,
        created_at
      FROM users 
      WHERE id = ?`,
      [user_id]
    );

    if (userResult.length === 0) {
      await connection.end();
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const user = userResult[0];
    const currentYear = new Date().getFullYear();

    // Get leave applications history
    const [leaveApplications] = await connection.execute(
      `SELECT 
        id,
        leave_type,
        start_date,
        end_date,
        total_days,
        reason,
        status,
        created_at as applied_date,
        approved_by,
        approved_at,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
      FROM leave_applications la
      LEFT JOIN users approver ON la.approved_by = approver.id
      WHERE la.user_id = ?
      ORDER BY la.created_at DESC`,
      [user_id]
    );

    // Get or create leave balance for current year
    let [balanceResult] = await connection.execute(
      'SELECT * FROM leave_balance WHERE user_id = ? AND year = ?',
      [user_id, currentYear]
    );

    // If no balance record exists, create one
    if (balanceResult.length === 0) {
      await connection.execute(
        `INSERT INTO leave_balance (user_id, year) VALUES (?, ?)`,
        [user_id, currentYear]
      );

      [balanceResult] = await connection.execute(
        'SELECT * FROM leave_balance WHERE user_id = ? AND year = ?',
        [user_id, currentYear]
      );
    }

    const balance = balanceResult[0];

    // Calculate used leave days from approved applications for current year
    const [usedLeaveData] = await connection.execute(
      `SELECT 
        leave_type,
        SUM(total_days) as days_used
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

    // Format leave balance response
    const leaveBalance = {
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

    // Calculate summary statistics
    const totalLeavesTaken = leaveApplications.filter(app => app.status === 'approved').length;
    const pendingApplications = leaveApplications.filter(app => app.status === 'pending').length;
    const rejectedApplications = leaveApplications.filter(app => app.status === 'rejected').length;

    return NextResponse.json({
      user: {
        ...user,
        full_name: `${user.first_name} ${user.last_name}`
      },
      leave_applications: leaveApplications,
      leave_balance: leaveBalance,
      summary: {
        total_applications: leaveApplications.length,
        approved_applications: totalLeavesTaken,
        pending_applications: pendingApplications,
        rejected_applications: rejectedApplications,
        total_leave_days_used: Object.values(leaveBalance.leave_types).reduce((sum, leave) => sum + leave.used, 0),
        total_leave_days_remaining: Object.values(leaveBalance.leave_types).reduce((sum, leave) => sum + leave.remaining, 0)
      }
    });

  } catch (err) {
    console.log("Error: User Leave Details API - " + err.message);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}
