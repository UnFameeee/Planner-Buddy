const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');
const { v4: uuidv4 } = require('uuid');

const Appointment = sequelize.define('appointment', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reminder_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  reminder_settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      enabled: true,
      minutes_before: 30,
      email_notification: true,
      reminder_type: 'once' // 'once', 'repeat'
    },
    comment: 'Cài đặt cho thông báo nhắc nhở'
  },
  email_reminders: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Danh sách các lần gửi email reminder'
  },
  tags: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? rawValue.split(',') : [];
    },
    set(val) {
      if (Array.isArray(val)) {
        this.setDataValue('tags', val.join(','));
      } else {
        this.setDataValue('tags', val);
      }
    }
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
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'appointment',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = Appointment; 