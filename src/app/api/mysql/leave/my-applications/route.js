import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';
import { checkUser } from '@/lib/auth/checkUser.js';

const connectionParams = GetDBSettings();

export async function GET(request) {
  const auth = await checkUser(request);
  if (auth.error) {
    return NextResponse.json(auth.error, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const connection = await mysql.createConnection(connectionParams);

    let query = `
      SELECT 
        la.id,
        la.user_id,
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
      LEFT JOIN users approver ON la.approved_by = approver.id
      WHERE la.user_id = ?
    `;

    const values = [auth.data.id];

    if (status) {
      query += ' AND la.status = ?';
      values.push(status);
    }

    query += ' ORDER BY la.created_at DESC';

    const [results] = await connection.execute(query, values);

    await connection.end();

    return NextResponse.json({ 
      results,
      count: results.length 
    });

  } catch (err) {
    console.log("Error: My Leave Applications API - " + err.message);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}
