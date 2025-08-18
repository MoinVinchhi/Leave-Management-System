import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common';

const connectionParams = GetDBSettings();

export async function GET(request) {
  try {
    const connection = await mysql.createConnection(connectionParams);

    const query = 'SELECT * FROM employees';
    const [results, fields] = await connection.execute(query);

    await connection.end();

    return NextResponse.json({ 
      fields: fields.map((f) => f.name), 
      results,
      count: results.length 
    });
  } catch (err) {
    console.log("Error: API - " + err.message);
    const response = {
      error: err.message,
      returnedStatus: 500
    };

    return NextResponse.json(response, { status: 500 });
  }
}
