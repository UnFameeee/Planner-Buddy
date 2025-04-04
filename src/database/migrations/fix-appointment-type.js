require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = require('../config')[process.env.NODE_ENV || 'development'];

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
    
    // Kiểm tra xem cột đã tồn tại chưa
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [dbConfig.database, 'appointment', 'appointment_type']
    );
    
    if (columns.length > 0) {
      console.log('Column appointment_type already exists. Skipping migration.');
    } else {
      console.log('Adding appointment_type column...');

      await connection.execute(`
        ALTER TABLE appointment 
        ADD COLUMN appointment_type VARCHAR(255) 
        DEFAULT 'other' 
        COMMENT 'Loại cuộc hẹn (meeting, personal, medical, other)'
      `);
      
      console.log('Successfully added appointment_type column!');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      console.log('Closing database connection...');
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Chạy migration
runMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 