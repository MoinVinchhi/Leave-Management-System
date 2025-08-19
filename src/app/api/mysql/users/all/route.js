
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
    // Check if user is HR
    if (request.data.role !== 'hr') {
      const response = {
        error: 'Forbidden: Only HR can access this resource',
        returnedStatus: 403
      };
      return NextResponse.json(response, { status: 403 });
    }

    const connection = await mysql.createConnection(connectionParams);

    const query = 'SELECT * FROM users';
    
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
