import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';

const connectionParams = GetDBSettings();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const status = searchParams.get('status');

    const connection = await mysql.createConnection(connectionParams);

    let query = `
      SELECT 
        la.id,
        la.employee_id,
        e.name as employee_name,
        e.email as employee_email,
        la.leave_type,
        la.start_date,
        la.end_date,
        la.reason,
        la.status,
        la.applied_date,
        la.approved_by,
        la.approved_date,
        DATEDIFF(la.end_date, la.start_date) + 1 as total_days
      FROM leave_applications la
      JOIN employees e ON la.employee_id = e.id
    `;

    const conditions = [];
    const values = [];

    if (employee_id) {
      conditions.push('la.employee_id = ?');
      values.push(employee_id);
    }

    if (status) {
      conditions.push('la.status = ?');
      values.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY la.applied_date DESC';

    const [results, fields] = await connection.execute(query, values);

    await connection.end();

    return NextResponse.json({ 
      fields: fields.map((f) => f.name), 
      results,
      count: results.length 
    });

  } catch (err) {
    console.log("Error: Leave Applications API - " + err.message);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}
