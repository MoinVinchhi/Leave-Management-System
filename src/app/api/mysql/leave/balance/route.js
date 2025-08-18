import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';

const connectionParams = GetDBSettings();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');

    if (!employee_id) {
      return NextResponse.json({ 
        error: 'employee_id parameter is required' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(connectionParams);

    // Create leave_balance table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS leave_balance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        year YEAR NOT NULL,
        sick_leave_total INT DEFAULT 12,
        sick_leave_used INT DEFAULT 0,
        vacation_leave_total INT DEFAULT 20,
        vacation_leave_used INT DEFAULT 0,
        personal_leave_total INT DEFAULT 5,
        personal_leave_used INT DEFAULT 0,
        emergency_leave_total INT DEFAULT 3,
        emergency_leave_used INT DEFAULT 0,
        maternity_leave_total INT DEFAULT 90,
        maternity_leave_used INT DEFAULT 0,
        paternity_leave_total INT DEFAULT 15,
        paternity_leave_used INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_year (employee_id, year)
      )
    `);

    // Check if employee exists
    const [employeeCheck] = await connection.execute(
      'SELECT id, name FROM employees WHERE id = ?',
      [employee_id]
    );

    if (employeeCheck.length === 0) {
      await connection.end();
      return NextResponse.json({ 
        error: 'Employee not found' 
      }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();

    // Check if leave balance record exists for current year
    let [balanceResult] = await connection.execute(
      'SELECT * FROM leave_balance WHERE employee_id = ? AND year = ?',
      [employee_id, currentYear]
    );

    // If no record exists for current year, create one with default values
    if (balanceResult.length === 0) {
      await connection.execute(
        `INSERT INTO leave_balance 
         (employee_id, year) 
         VALUES (?, ?)`,
        [employee_id, currentYear]
      );

      // Fetch the newly created record
      [balanceResult] = await connection.execute(
        'SELECT * FROM leave_balance WHERE employee_id = ? AND year = ?',
        [employee_id, currentYear]
      );
    }

    const balance = balanceResult[0];

    // Calculate used leave days from leave_applications table
    const [usedLeaveData] = await connection.execute(
      `SELECT 
        leave_type,
        SUM(DATEDIFF(end_date, start_date) + 1) as days_used
       FROM leave_applications 
       WHERE employee_id = ? 
         AND status = 'approved' 
         AND YEAR(start_date) = ?
       GROUP BY leave_type`,
      [employee_id, currentYear]
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
       WHERE employee_id = ? AND year = ?`,
      [
        usedLeave.sick || 0,
        usedLeave.vacation || 0,
        usedLeave.personal || 0,
        usedLeave.emergency || 0,
        usedLeave.maternity || 0,
        usedLeave.paternity || 0,
        employee_id,
        currentYear
      ]
    );

    // Fetch updated balance
    [balanceResult] = await connection.execute(
      'SELECT * FROM leave_balance WHERE employee_id = ? AND year = ?',
      [employee_id, currentYear]
    );

    const updatedBalance = balanceResult[0];

    await connection.end();

    // Format response
    const leaveBalance = {
      employee_id: parseInt(employee_id),
      employee_name: employeeCheck[0].name,
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
