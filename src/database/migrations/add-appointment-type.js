const { Sequelize } = require('sequelize');
const { sequelize } = require('../index');

module.exports = {
  up: async () => {
    try {
      console.log('Running migration to add appointment_type column to appointment table...');
      
      // Thêm trường appointment_type vào bảng appointment
      await sequelize.query(`
        ALTER TABLE appointment 
        ADD COLUMN appointment_type VARCHAR(255) 
        DEFAULT 'other' 
        COMMENT 'Loại cuộc hẹn (meeting, personal, medical, other)'
      `);
      
      console.log('Successfully added appointment_type column to appointment table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding appointment_type column:', error);
      return Promise.reject(error);
    }
  },

  down: async () => {
    try {
      console.log('Rolling back: removing appointment_type column from appointment table...');
      
      // Xóa trường appointment_type khỏi bảng appointment
      await sequelize.query(`
        ALTER TABLE appointment 
        DROP COLUMN appointment_type
      `);
      
      console.log('Successfully removed appointment_type column from appointment table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing appointment_type column:', error);
      return Promise.reject(error);
    }
  }
};