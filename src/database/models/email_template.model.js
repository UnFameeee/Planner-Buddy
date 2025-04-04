const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');
const { v4: uuidv4 } = require('uuid');

const EmailTemplate = sequelize.define('email_template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Tên template, ví dụ: appointment_reminder, todo_reminder'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Tiêu đề email mẫu'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'Nội dung HTML template với các merge tags'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả về template'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Trạng thái hoạt động của template'
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
  tableName: 'email_template',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = EmailTemplate; 