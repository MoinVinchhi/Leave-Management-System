import mysql from 'mysql2/promise';
import { GetDBSettings } from '../../sharedCode/common.js';
import { 
  createUsersTable, 
  createLeaveApplicationsTable, 
  createLeaveBalanceTable 
} from './schema.js';

export async function initializeDatabase() {
  const connection = await mysql.createConnection(GetDBSettings());
  
  try {
    await connection.execute(createUsersTable);
    await connection.execute(createLeaveApplicationsTable);
    await connection.execute(createLeaveBalanceTable);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}
