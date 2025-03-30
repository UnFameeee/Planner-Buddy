require('dotenv').config();
const { sequelize } = require('../index');
const { DataTypes } = require('sequelize');

async function addDeletedAtColumns() {
  try {
    console.log('Starting migration: Add deleted_at columns');
    const queryInterface = sequelize.getQueryInterface();

    // Kiểm tra và thêm cột deleted_at vào bảng email_queue
    try {
      const emailQueueColumns = await queryInterface.describeTable('email_queue');
      if (!emailQueueColumns.deleted_at) {
        console.log('Adding deleted_at column to email_queue table...');
        await queryInterface.addColumn('email_queue', 'deleted_at', {
          type: DataTypes.DATE,
          allowNull: true
        });
        console.log('deleted_at column added to email_queue successfully');
      } else {
        console.log('deleted_at column already exists in email_queue');
      }
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.parent.code === 'ER_NO_SUCH_TABLE') {
        console.log('email_queue table does not exist yet, skipping');
      } else {
        throw error;
      }
    }

    // Kiểm tra và thêm cột deleted_at vào bảng email_progress
    try {
      const emailProgressColumns = await queryInterface.describeTable('email_progress');
      if (!emailProgressColumns.deleted_at) {
        console.log('Adding deleted_at column to email_progress table...');
        await queryInterface.addColumn('email_progress', 'deleted_at', {
          type: DataTypes.DATE,
          allowNull: true
        });
        console.log('deleted_at column added to email_progress successfully');
      } else {
        console.log('deleted_at column already exists in email_progress');
      }
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.parent.code === 'ER_NO_SUCH_TABLE') {
        console.log('email_progress table does not exist yet, skipping');
      } else {
        throw error;
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    process.exit(0);
  }
}

addDeletedAtColumns(); 