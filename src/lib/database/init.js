import 'dotenv/config';
import mysql from 'mysql2/promise';
import { GetDBSettings } from '../../sharedCode/common.js';
import { 
  createUsersTable, 
  createLeaveApplicationsTable, 
  createLeaveBalanceTable 
} from './schema.js';

export async function initializeDatabase() {
  // Debug: Log environment variables
  console.log('🔍 Environment check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DB Host:', process.env.host_dev);
  console.log('DB User:', process.env.user_dev);
  console.log('DB Password:', process.env.password_dev ? '***' : 'EMPTY');
  console.log('DB Name:', process.env.database_dev);
  
  const dbSettings = GetDBSettings();
  console.log('🔄 Connecting to database with settings:', {
    host: dbSettings.host,
    port: dbSettings.port,
    user: dbSettings.user,
    password: dbSettings.password ? '***' : 'EMPTY',
    database: dbSettings.database
  });
  
  const connection = await mysql.createConnection(dbSettings);
  
  try {
    console.log('🔄 Creating database tables...');
    
    await connection.execute(createUsersTable);
    console.log('✅ Users table created/verified');
    
    await connection.execute(createLeaveApplicationsTable);
    console.log('✅ Leave applications table created/verified');
    
    await connection.execute(createLeaveBalanceTable);
    console.log('✅ Leave balance table created/verified');
    
    console.log('🎉 Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

initializeDatabase().catch(console.error);
