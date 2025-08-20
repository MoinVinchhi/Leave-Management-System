# Leave Management System

A comprehensive web-based Leave Management System built with **Next.js** and **MySQL** that enables employees to apply for leave and HR personnel to manage leave requests efficiently.

## 🚀 Features

### **For Employees**
- ✅ **User Registration & Login** with JWT authentication
- ✅ **Apply for Leave** with multiple leave types (Sick, Vacation, Personal, Emergency, Maternity, Paternity)
- ✅ **View Leave Applications** with status tracking (Pending, Approved, Rejected)
- ✅ **Check Leave Balance** with visual progress indicators
- ✅ **Real-time Validation** for leave requests and balance checking

### **For HR Personnel**
- ✅ **Manage All Users** (Add, View, Edit, Delete employees)
- ✅ **Leave Request Management** (Approve/Reject leave applications)
- ✅ **Leave Balance Management** for all employees
- ✅ **Role-based Access Control** with HR-specific features
- ✅ **Comprehensive Dashboard** with quick access to all functions

### **Technical Features**
- ✅ **Responsive Design** with Tailwind CSS
- ✅ **Secure Authentication** with JWT tokens and HTTP-only cookies
- ✅ **RESTful API** with proper error handling
- ✅ **Input Validation** on both client and server side
- ✅ **Dynamic Routing** with Next.js App Router
- ✅ **Database Integration** with MySQL and connection pooling

## 🛠 Technology Stack

- **Frontend**: Next.js 15+, React, Tailwind CSS, Lucide React Icons
- **Backend**: Next.js API Routes, JWT Authentication
- **Database**: MySQL with mysql2/promise
- **Validation**: Custom validation with bcrypt for password hashing
- **Styling**: Tailwind CSS with responsive design
- **Deployment**: Vercel-ready configuration

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v18.0 or higher)
- **npm** or **yarn** package manager
- **MySQL** (v8.0 or higher)
- **Git** for version control

## ⚙️ Setup Instructions

### **1. Clone the Repository**

```bash
git clone https://github.com/MoinVinchhi/Leave-Management-System.git
cd Leave-Management-System
```

### **2. Install Dependencies**

```bash
npm install
# or
yarn install
```

### **3. Environment Configuration**

Create a `.env` file in the root directory:

```env
NODE_ENV=development

# Database Configuration
host_dev=localhost
port_dev=3306
user_dev=root
password_dev=your_mysql_password
database_dev=lms

# JWT Secret (use a strong, random string)
JWT_SECRET=your_super_secret_jwt_key_here
```

### **4. Database Setup**

```bash
node src/lib/database/init.js
```

### **5. Add Dummy Data (Optional)**

To populate your database with sample users, leave applications, and balances for testing:

```bash
node src/lib/database/seed.js
```

This will create:
- **5 Sample Users** (3 employees + 2 HR personnel)
- **Sample Leave Applications** with different statuses
- **Leave Balances** for all employees
- **Default Login Credentials**:
  - **Employee**: `john.doe@company.com` / `password123`
  - **HR**: `admin@company.com` / `password123`

### **6. Run the Application**

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Leave-Management-System/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── mysql/
│   │   │       ├── auth/          # Authentication APIs
│   │   │       ├── employees/     # User management APIs
│   │   │       └── leave/         # Leave management APIs
│   │   ├── add-user/              # Add employee page
│   │   ├── apply-leave/           # Apply leave page
│   │   ├── dashboard/             # Main dashboard
│   │   ├── login/                 # Login page
│   │   ├── manage-leave-requests/ # HR leave management
│   │   ├── my-leave-applications/ # Employee leave history
│   │   ├── my-leave-balance/      # Leave balance view
│   │   └── view-users/            # User management page
│   └── sharedCode/
│       └── common.js             # Database configuration
├── .env                          # Environment variables
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🔐 User Management & Authentication

### **HR Privileges**
- ✅ **Only HR personnel** can add new employees or other HR users to the system
- ✅ **Employee Registration** is restricted - employees cannot self-register
- ✅ **Role Assignment** is controlled by HR during user creation

### **Default Password System**
When HR adds a new user, the system automatically generates a default password using the format:
```
<first_name>.<last_name>.<role>@123
```

**Examples:**
- Employee: `john.doe.employee@123`
- HR User: `sarah.wilson.hr@123`

**Important**: Users should change their default password after first login for security.

### **Login Credentials**
- **Email**: As provided during user creation
- **Password**: Default format or user-changed password

## 📚 API Documentation

### **Authentication Endpoints**
- `POST /api/mysql/auth/register` - User registration
- `POST /api/mysql/auth/login` - User login
- `GET /api/mysql/auth/verify` - Verify JWT token
- `POST /api/mysql/auth/logout` - User logout

### **User Management Endpoints**
- `GET /api/mysql/employees` - Get all users (HR only)
- `POST /api/mysql/employees` - Create new user (HR only)
- `GET /api/mysql/employees/[id]` - Get user by ID
- `PUT /api/mysql/employees/[id]` - Update user (HR only)
- `DELETE /api/mysql/employees/[id]` - Delete user (HR only)

### **Leave Management Endpoints**
- `POST /api/mysql/leave/apply` - Apply for leave (only employee)
- `GET /api/mysql/leave/my-applications` - Get current user's applications
- `GET /api/mysql/leave/all` - Get all applications (HR only)
- `PUT /api/mysql/leave/[id]/approve` - Approve leave (HR only)
- `PUT /api/mysql/leave/[id]/reject` - Reject leave (HR only)

### **Leave Balance Endpoints**
- `GET /api/mysql/leave/my-balance` - Get current user's balance
- `GET /api/mysql/leave/balance/[id]` - Get user balance by ID
- `PUT /api/mysql/leave/balance/[id]` - Update user balance (HR only)

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **Password Hashing** using bcrypt
- **Role-based Authorization** (Employee vs HR)
- **Input Validation** on all forms and APIs
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with proper data sanitization

## 📋 Assumptions

### **Business Logic Assumptions**
1. **Leave Year**: Leave balance is calculated per calendar year (Jan-Dec)
2. **Leave Types**: 6 predefined leave types with default quotas:
   - Sick Leave: 12 days/year
   - Vacation Leave: 20 days/year
   - Personal Leave: 5 days/year
   - Emergency Leave: 3 days/year
   - Maternity Leave: 90 days/year
   - Paternity Leave: 15 days/year
3. **Weekend Calculation**: All days (including weekends) are counted as leave days
4. **Past Date Restriction**: Users cannot apply for leave with start dates in the past
5. **Balance Check**: System prevents leave application if insufficient balance
6. **Auto-deduction**: Leave balance is automatically deducted upon application (not approval)

### **Technical Assumptions**
1. **Single Database**: Application uses a single MySQL database
2. **Session Management**: JWT tokens stored in HTTP-only cookies
3. **File Upload**: No file attachments for leave applications (text-only reasons)
4. **Email Notifications**: Not implemented (mentioned as future improvement)
5. **Time Zone**: All dates handled in server's local timezone
6. **Browser Support**: Modern browsers with JavaScript enabled

### **User Role Assumptions**
1. **HR Privileges**: HR users can manage all employees and leave requests
2. **Employee Restrictions**: Employees can only view/manage their own data
3. **User Creation**: Only HR personnel can add new employees or HR users to the system
4. **Default Passwords**: New users get auto-generated passwords in format `<first_name>.<last_name>.<role>@123`
5. **Single Role**: Users have only one role (either 'employee' or 'hr')

---
