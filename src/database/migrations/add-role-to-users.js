require('dotenv').config();
const { sequelize } = require('../index');
const { DataTypes } = require('sequelize');
const { User } = require('../models');

async function addRoleToUsers() {
  try {
    console.log('Starting migration: Add role to users');
    
    // Kiểm tra xem trường role đã tồn tại chưa
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('user');
    
    // Nếu trường role chưa tồn tại, thêm vào
    if (!tableInfo.role) {
      console.log('Role column does not exist, adding it...');
      
      // Thêm trường role vào bảng user
      await queryInterface.addColumn('user', 'role', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user'
      });
      
      console.log('Role column added successfully');
    } else {
      console.log('Role column already exists');
    }
    
    // Cập nhật role cho admin
    const admins = await User.findAll({
      where: {
        username: 'admin'
      }
    });
    
    if (admins.length > 0) {
      for (const admin of admins) {
        await admin.update({ role: 'admin' });
        console.log(`Updated role to 'admin' for user ${admin.username}`);
      }
    } else {
      console.log('No admin users found');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    process.exit(0);
  }
}

addRoleToUsers(); 