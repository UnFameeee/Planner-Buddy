require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = require('../config')[process.env.NODE_ENV || 'development'];
const { v4: uuidv4 } = require('uuid');

// Mẫu HTML mặc định cho email nhắc nhở cuộc hẹn
const DEFAULT_APPOINTMENT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Reminder</title>
    <style>
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #72d1a8;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .logo {
            max-height: 60px;
            margin-bottom: 15px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
        }
        .appointment-box {
            background-color: #f9f9f9;
            border-left: 4px solid #72d1a8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .appointment-item {
            margin-bottom: 15px;
        }
        .label {
            font-weight: bold;
            color: #555555;
            display: block;
            margin-bottom: 5px;
        }
        .value {
            padding-left: 10px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777777;
            background-color: #f5f5f5;
        }
        .button {
            display: inline-block;
            background-color: #72d1a8;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: bold;
        }
        .button:hover {
            background-color: #5fb890;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- <img src="{{logo_url}}" alt="Planner Buddy Logo" class="logo"> -->
            <h1>Appointment Reminder</h1>
        </div>
        
        <div class="content">
            <p>Hello {{recipient_name}},</p>
            
            <p>This is a friendly reminder of your upcoming appointment:</p>
            
            <div class="appointment-box">
                <div class="appointment-item">
                    <span class="label">Title:</span>
                    <span class="value">{{appointment_title}}</span>
                </div>
                
                <div class="appointment-item">
                    <span class="label">Date & Time:</span>
                    <span class="value">{{appointment_time}}</span>
                </div>
                
                <div class="appointment-item">
                    <span class="label">Location:</span>
                    <span class="value">{{appointment_location}}</span>
                </div>
                
                <div class="appointment-item">
                    <span class="label">Description:</span>
                    <span class="value">{{appointment_description}}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This reminder was sent by <strong>Planner Buddy</strong></p>
            <p>{{company_address}}</p>
            <p><a href="{{unsubscribe_link}}">Unsubscribe</a> | <a href="{{privacy_policy_link}}">Privacy Policy</a></p>
        </div>
    </div>
</body>
</html>`;

// Template mẫu cho todo reminder
const DEFAULT_TODO_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo Reminder</title>
    <style>
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #4a8cca;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
        }
        .todo-box {
            background-color: #f9f9f9;
            border-left: 4px solid #4a8cca;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .todo-item {
            margin-bottom: 15px;
        }
        .label {
            font-weight: bold;
            color: #555555;
            display: block;
            margin-bottom: 5px;
        }
        .value {
            padding-left: 10px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777777;
            background-color: #f5f5f5;
        }
        .button {
            display: inline-block;
            background-color: #4a8cca;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: bold;
        }
        .button:hover {
            background-color: #3a7ab8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Todo Reminder</h1>
        </div>
        
        <div class="content">
            <p>Hello {{recipient_name}},</p>
            
            <p>This is a reminder about your task:</p>
            
            <div class="todo-box">
                <div class="todo-item">
                    <span class="label">Task:</span>
                    <span class="value">{{todo_title}}</span>
                </div>
                
                <div class="todo-item">
                    <span class="label">Due Date:</span>
                    <span class="value">{{todo_due_date}}</span>
                </div>
                
                <div class="todo-item">
                    <span class="label">Priority:</span>
                    <span class="value">{{todo_priority}}</span>
                </div>
                
                <div class="todo-item">
                    <span class="label">Description:</span>
                    <span class="value">{{todo_description}}</span>
                </div>
            </div>
            
            <a href="{{app_url}}" class="button">View Task</a>
        </div>
        
        <div class="footer">
            <p>This reminder was sent by <strong>Planner Buddy</strong></p>
            <p>{{company_address}}</p>
            <p><a href="{{unsubscribe_link}}">Unsubscribe</a> | <a href="{{privacy_policy_link}}">Privacy Policy</a></p>
        </div>
    </div>
</body>
</html>`;

async function runMigration() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database
    });

    console.log('Connected to database. Running migration...');
    
    // Kiểm tra xem bảng đã tồn tại chưa
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbConfig.database, 'email_template']
    );
    
    // Nếu bảng chưa tồn tại, tạo bảng mới
    if (tables.length === 0) {
      console.log('Creating email_template table...');
      
      await connection.execute(`
        CREATE TABLE email_template (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          subject VARCHAR(255) NOT NULL,
          content LONGTEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          deleted_at DATETIME
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log('Table created successfully. Inserting default templates...');
      
      // Thêm mẫu mặc định
      await connection.execute(`
        INSERT INTO email_template (id, name, subject, content, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), 
        'appointment_reminder', 
        'Reminder: {{appointment_title}}',
        DEFAULT_APPOINTMENT_TEMPLATE,
        'Default template for appointment reminders',
        true
      ]);
      
      await connection.execute(`
        INSERT INTO email_template (id, name, subject, content, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), 
        'todo_reminder', 
        'Todo Reminder: {{todo_title}}',
        DEFAULT_TODO_TEMPLATE,
        'Default template for todo reminders',
        true
      ]);
      
      console.log('Default templates inserted successfully.');
    } else {
      console.log('Table email_template already exists. Skipping table creation.');
      
      // Kiểm tra xem đã có templates chưa
      const [templates] = await connection.execute(`
        SELECT * FROM email_template WHERE name IN ('appointment_reminder', 'todo_reminder')
      `);
      
      if (templates.length < 2) {
        console.log('Inserting missing default templates...');
        
        // Kiểm tra và thêm mẫu appointment_reminder nếu chưa có
        const appointmentTemplate = templates.find(t => t.name === 'appointment_reminder');
        if (!appointmentTemplate) {
          await connection.execute(`
            INSERT INTO email_template (id, name, subject, content, description, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(), 
            'appointment_reminder', 
            'Reminder: {{appointment_title}}',
            DEFAULT_APPOINTMENT_TEMPLATE,
            'Default template for appointment reminders',
            true
          ]);
          console.log('Inserted appointment_reminder template.');
        }
        
        // Kiểm tra và thêm mẫu todo_reminder nếu chưa có
        const todoTemplate = templates.find(t => t.name === 'todo_reminder');
        if (!todoTemplate) {
          await connection.execute(`
            INSERT INTO email_template (id, name, subject, content, description, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(), 
            'todo_reminder', 
            'Todo Reminder: {{todo_title}}',
            DEFAULT_TODO_TEMPLATE,
            'Default template for todo reminders',
            true
          ]);
          console.log('Inserted todo_reminder template.');
        }
      } else {
        console.log('Default templates already exist.');
      }
    }
    
    console.log('Email templates migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      console.log('Closing database connection...');
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Chạy migration
runMigration()
  .then(() => {
    console.log('Email templates migration completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 