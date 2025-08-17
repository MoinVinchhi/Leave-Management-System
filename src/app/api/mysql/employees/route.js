import { NextResponse, NextRequest } from 'next/server'
import mysql from  'mysql2/promise';
import { GetDBSettings } from '@/sharedCode/common'

const connectionParams = GetDBSettings();

export async function GET(request) {

  try {
    const dateFrom = request.nextUrl?.searchParams?.get('datefrom');
    const dateTo = request.nextUrl?.searchParams?.get('dateto');

    console.log({ dateFrom, dateTo });

    const connection = await mysql.createConnection(connectionParams);

    const query = 'SELECT * FROM employees WHERE join_date BETWEEN ? AND ?';

    const values = [dateFrom, dateTo];

    const [results, fields] = await connection.execute(query, values)

    connection.end();

    return NextResponse.json({ fields: fields.map((f) => f.name), results });
  }
  catch (err) {
    console.log("Error: API - " + err.message);
    const response = {
        error: err.message,
        returnedStatus: 200
    }

    return NextResponse.json(response, { status: 200 })
  }
}
