const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');
const { v4: uuidv4 } = require('uuid');

const EmailQueue = sequelize.define('email_queue', {
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
    allowNull: true,
    references: {
      model: 'appointment',
      key: 'id'
    }
  },
  todo_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'todo',
      key: 'id'
    }
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Thời gian dự kiến gửi email'
  },
  email_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'reminder',
    comment: 'Loại email (reminder, notification, etc.)'
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
    defaultValue: 'pending',
    comment: 'Trạng thái: pending, transferred, canceled'
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'UTC',
    comment: 'Múi giờ của người dùng để tính thời gian gửi'
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
}, {
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'email_queue',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = EmailQueue; 