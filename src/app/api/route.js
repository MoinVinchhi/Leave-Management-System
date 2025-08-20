import { NextResponse, NextRequest } from 'next/server'
// import { GetDBSettings } from '@/sharedCode/common';
// const connectionParams = GetDBSettings();
export async function GET(request) {
  // this is going to be my JSON response

  const results = {
    message: 'Hello from Leave Managment System!',
  }

  // response with the JSON object

  return NextResponse.json(results)
}
