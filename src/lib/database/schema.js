export const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL,
    department VARCHAR(100),
    role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL
  )
`;

export const createLeaveApplicationsTable = `
  CREATE TABLE IF NOT EXISTS leave_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type ENUM('sick', 'vacation', 'personal', 'emergency', 'maternity', 'paternity') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  )
`;

export const createLeaveBalanceTable = `
  CREATE TABLE IF NOT EXISTS leave_balance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    year INT NOT NULL,
    sick_leave_total INT DEFAULT 12,
    sick_leave_used INT DEFAULT 0,
    vacation_leave_total INT DEFAULT 20,
    vacation_leave_used INT DEFAULT 0,
    personal_leave_total INT DEFAULT 5,
    personal_leave_used INT DEFAULT 0,
    emergency_leave_total INT DEFAULT 3,
    emergency_leave_used INT DEFAULT 0,
    maternity_leave_total INT DEFAULT 90,
    maternity_leave_used INT DEFAULT 0,
    paternity_leave_total INT DEFAULT 15,
    paternity_leave_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_year (user_id, year)
  )
`;