const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');
const { v4: uuidv4 } = require('uuid');

const EmailProgress = sequelize.define('email_progress', {
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
    },
    comment: 'ID tham chiếu từ bảng email_queue'
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
    allowNull: false,
    comment: 'Email người nhận'
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
    defaultValue: 'processing',
    comment: 'Trạng thái: processing, sent, failed'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Mức độ ưu tiên (1: cao nhất)'
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Số lần thử gửi'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Thông báo lỗi nếu gửi thất bại'
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian email được xử lý'
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
  tableName: 'email_progress',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = EmailProgress; 