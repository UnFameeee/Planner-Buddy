'use strict';
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
    
    // Kiểm tra xem cột todo_id đã tồn tại trong bảng email_queue chưa
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [dbConfig.database, 'email_queue', 'todo_id']
    );

    // Nếu cột chưa tồn tại, thêm cột mới
    if (columns.length === 0) {
      console.log('Adding todo_id column to email_queue table...');
      
      // Lấy thông tin về khóa ngoại
      const [foreignKeys] = await connection.execute(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [dbConfig.database, 'email_queue', 'appointment_id']
      );
      
      // Xóa các khóa ngoại nếu có
      if (foreignKeys.length > 0) {
        console.log(`Found ${foreignKeys.length} foreign key constraints. Dropping them...`);
        
        for (const fk of foreignKeys) {
          console.log(`Dropping foreign key constraint: ${fk.CONSTRAINT_NAME}`);
          await connection.execute(`
            ALTER TABLE email_queue
            DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
          `);
        }
      }
      
      // Thêm cột todo_id
      console.log('Adding todo_id column...');
      await connection.execute(`
        ALTER TABLE email_queue 
        ADD COLUMN todo_id VARCHAR(36) NULL
      `);
      
      // Cập nhật cột appointment_id thành nullable
      console.log('Modifying appointment_id to be nullable...');
      await connection.execute(`
        ALTER TABLE email_queue 
        MODIFY COLUMN appointment_id VARCHAR(36) NULL
      `);
      
      // Tạo lại foreign key cho appointment_id
      console.log('Re-creating foreign key for appointment_id...');
      await connection.execute(`
        ALTER TABLE email_queue
        ADD CONSTRAINT fk_email_queue_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointment(id)
      `);
      
      // Tạo foreign key cho todo_id
      console.log('Creating foreign key for todo_id...');
      await connection.execute(`
        ALTER TABLE email_queue
        ADD CONSTRAINT fk_email_queue_todo
        FOREIGN KEY (todo_id) REFERENCES todo(id)
      `);
      
      // Thêm chỉ mục cho cột todo_id
      console.log('Creating index for todo_id...');
      await connection.execute(`
        CREATE INDEX idx_email_queue_todo_id ON email_queue(todo_id)
      `);
      
      console.log('Migration completed successfully.');
    } else {
      console.log('Column todo_id already exists in email_queue table. Skipping migration.');
    }
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
    console.log('Todo email queue migration completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm cột todo_id
    await queryInterface.addColumn('email_queue', 'todo_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'todo',
        key: 'id'
      },
      after: 'appointment_id'
    });

    // Cập nhật cột appointment_id thành nullable
    await queryInterface.changeColumn('email_queue', 'appointment_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'appointment',
        key: 'id'
      }
    });

    // Thêm chỉ mục cho cột todo_id
    await queryInterface.addIndex('email_queue', ['todo_id'], {
      name: 'idx_email_queue_todo_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa chỉ mục
    await queryInterface.removeIndex('email_queue', 'idx_email_queue_todo_id');
    
    // Xóa cột todo_id
    await queryInterface.removeColumn('email_queue', 'todo_id');
    
    // Cập nhật lại appointment_id thành not nullable
    await queryInterface.changeColumn('email_queue', 'appointment_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'appointment',
        key: 'id'
      }
    });
  }
}; 