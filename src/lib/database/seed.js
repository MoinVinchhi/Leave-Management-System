import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { GetDBSettings } from '../../sharedCode/common.js';

export async function insertDummyData() {
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
    console.log('🔄 Adding dummy data to tables...');
    
    // Hash passwords for dummy users
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert dummy users
    console.log('📝 Adding dummy users...');
    const users = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Engineering',
        join_date: '2024-01-15'
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@company.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Marketing',
        join_date: '2024-02-01'
      },
      {
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike.johnson@company.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Sales',
        join_date: '2024-01-20'
      },
      {
        first_name: 'Sarah',
        last_name: 'Wilson',
        email: 'sarah.wilson@company.com',
        password: hashedPassword,
        role: 'hr',
        department: 'Human Resources',
        join_date: '2023-12-01'
      },
      {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'hr',
        department: 'Human Resources',
        join_date: '2023-11-15'
      }
    ];

    for (const user of users) {
      await connection.execute(
        `INSERT IGNORE INTO users (first_name, last_name, email, password, role, department, join_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.first_name, user.last_name, user.email, user.password, user.role, user.department, user.join_date]
      );
    }
    console.log('✅ Dummy users added');

    // Get user IDs for leave applications and balances
    const [userRows] = await connection.execute('SELECT id, email FROM users WHERE role = "employee"');
    const employeeIds = userRows.map(row => row.id);
    
    if (employeeIds.length === 0) {
      console.log('⚠️ No employees found to create leave data');
      return;
    }

    // Insert dummy leave applications
    console.log('📝 Adding dummy leave applications...');
    const currentYear = new Date().getFullYear();
    const leaveApplications = [
      {
        user_id: employeeIds[0],
        leave_type: 'sick',
        start_date: `${currentYear}-01-15`,
        end_date: `${currentYear}-01-17`,
        total_days: 3,
        reason: 'Flu and fever, need rest to recover',
        status: 'approved'
      },
      {
        user_id: employeeIds[0],
        leave_type: 'vacation',
        start_date: `${currentYear}-03-20`,
        end_date: `${currentYear}-03-25`,
        total_days: 6,
        reason: 'Family vacation to the mountains',
        status: 'approved'
      },
      {
        user_id: employeeIds[1] || employeeIds[0],
        leave_type: 'personal',
        start_date: `${currentYear}-02-10`,
        end_date: `${currentYear}-02-10`,
        total_days: 1,
        reason: 'Personal appointment with doctor',
        status: 'pending'
      },
      {
        user_id: employeeIds[1] || employeeIds[0],
        leave_type: 'vacation',
        start_date: `${currentYear}-06-15`,
        end_date: `${currentYear}-06-20`,
        total_days: 6,
        reason: 'Summer vacation with family',
        status: 'rejected'
      },
      {
        user_id: employeeIds[2] || employeeIds[0],
        leave_type: 'emergency',
        start_date: `${currentYear}-04-05`,
        end_date: `${currentYear}-04-06`,
        total_days: 2,
        reason: 'Family emergency, need to attend to urgent matter',
        status: 'approved'
      }
    ];

    for (const leave of leaveApplications) {
      await connection.execute(
        `INSERT IGNORE INTO leave_applications (user_id, leave_type, start_date, end_date, total_days, reason, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [leave.user_id, leave.leave_type, leave.start_date, leave.end_date, leave.total_days, leave.reason, leave.status]
      );
    }
    console.log('✅ Dummy leave applications added');

    // Insert dummy leave balances
    console.log('📝 Adding dummy leave balances...');
    for (const userId of employeeIds) {
      await connection.execute(
        `INSERT IGNORE INTO leave_balance (
          user_id, year, 
          sick_leave_total, sick_leave_used,
          vacation_leave_total, vacation_leave_used,
          personal_leave_total, personal_leave_used,
          emergency_leave_total, emergency_leave_used,
          maternity_leave_total, maternity_leave_used,
          paternity_leave_total, paternity_leave_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, currentYear,
          12, Math.floor(Math.random() * 5), // sick: 12 total, 0-4 used
          20, Math.floor(Math.random() * 8), // vacation: 20 total, 0-7 used
          5, Math.floor(Math.random() * 3),  // personal: 5 total, 0-2 used
          3, Math.floor(Math.random() * 2),  // emergency: 3 total, 0-1 used
          90, 0,                             // maternity: 90 total, 0 used
          15, 0                              // paternity: 15 total, 0 used
        ]
      );
    }
    console.log('✅ Dummy leave balances added');

    // Show summary
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [leaveCount] = await connection.execute('SELECT COUNT(*) as count FROM leave_applications');
    const [balanceCount] = await connection.execute('SELECT COUNT(*) as count FROM leave_balance');
    
    console.log('\n📊 Database Summary:');
    console.log(`👥 Total Users: ${userCount[0].count}`);
    console.log(`📝 Total Leave Applications: ${leaveCount[0].count}`);
    console.log(`⚖️ Total Leave Balances: ${balanceCount[0].count}`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('📧 Employee: john.doe@company.com');
    console.log('📧 HR: admin@company.com');
    console.log('🔒 Password: password123');
    
    console.log('\n🎉 Dummy data insertion completed successfully!');
    
  } catch (error) {
    console.error('❌ Error inserting dummy data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Execute the function when file is run directly
insertDummyData().catch(console.error);
