import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';

const connectionParams = GetDBSettings();

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, join_date } = body;
    if (!name || !email || !join_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await mysql.createConnection(connectionParams);

    const query = 'INSERT INTO employees (name, email, join_date) VALUES (?, ?, ?);'

    const [result] = await connection.execute(
      query,
      [name, email, join_date]
    );
    await connection.end();
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
