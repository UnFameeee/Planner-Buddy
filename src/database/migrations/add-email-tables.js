require('dotenv').config();
const { sequelize } = require('../index');
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

async function addEmailTables() {
  try {
    console.log('Starting migration: Add email tables');
    const queryInterface = sequelize.getQueryInterface();

    // Kiểm tra xem bảng email_queue đã tồn tại chưa
    let tables = await sequelize.getQueryInterface().showAllTables();
    
    if (!tables.includes('email_queue')) {
      console.log('Creating email_queue table...');
      await queryInterface.createTable('email_queue', {
        id: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id'
          }
        },
        appointment_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'appointment',
            key: 'id'
          }
        },
        scheduled_time: {
          type: DataTypes.DATE,
          allowNull: false
        },
        email_type: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'reminder'
        },
        email_subject: {
          type: DataTypes.STRING,
          allowNull: false
        },
        email_content: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'pending'
        },
        timezone: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'UTC'
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      });
      console.log('email_queue table created successfully');
    } else {
      console.log('email_queue table already exists');
    }

    // Kiểm tra xem bảng email_progress đã tồn tại chưa
    tables = await sequelize.getQueryInterface().showAllTables();
    
    if (!tables.includes('email_progress')) {
      console.log('Creating email_progress table...');
      await queryInterface.createTable('email_progress', {
        id: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          primaryKey: true,
          allowNull: false
        },
        email_queue_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'email_queue',
            key: 'id'
          }
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id'
          }
        },
        appointment_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'appointment',
            key: 'id'
          }
        },
        recipient_email: {
          type: DataTypes.STRING,
          allowNull: false
        },
        email_subject: {
          type: DataTypes.STRING,
          allowNull: false
        },
        email_content: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'processing'
        },
        priority: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        attempts: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        error_message: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        processed_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      });
      console.log('email_progress table created successfully');
    } else {
      console.log('email_progress table already exists');
    }

    // Kiểm tra và cập nhật bảng appointment nếu cần
    const appointmentColumns = await queryInterface.describeTable('appointment');
    
    if (!appointmentColumns.reminder_settings) {
      console.log('Adding reminder_settings column to appointment table...');
      await queryInterface.addColumn('appointment', 'reminder_settings', {
        type: DataTypes.JSON,
        allowNull: true
      });
      console.log('reminder_settings column added successfully');
    } else {
      console.log('reminder_settings column already exists');
    }
    
    if (!appointmentColumns.email_reminders) {
      console.log('Adding email_reminders column to appointment table...');
      await queryInterface.addColumn('appointment', 'email_reminders', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      });
      console.log('email_reminders column added successfully');
    } else {
      console.log('email_reminders column already exists');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    process.exit(0);
  }
}

addEmailTables(); 