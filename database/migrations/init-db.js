require('dotenv').config();
const { sequelize } = require('../index');
const models = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function initDatabase() {
  try {
    // Sync all models with database
    console.log('Syncing database models...');
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully!');

    // Create default admin user
    console.log('Creating default admin user...');
    const adminId = uuidv4();
    const defaultAdmin = await models.User.create({
      id: adminId,
      username: 'admin',
      email: 'admin@example.com',
      password: bcrypt.hashSync('admin123', 10),
      is_active: true,
      timezone: 'UTC'
    });
    console.log(`Admin user created with ID: ${defaultAdmin.id}`);

    // Create default settings
    console.log('Creating default settings...');
    await models.Setting.bulkCreate([
      {
        key: 'app_name',
        value: 'Planner Buddy',
        description: 'Application name'
      },
      {
        key: 'default_reminder_time',
        value: '60',
        description: 'Default reminder time in minutes before an event'
      },
      {
        key: 'enable_email_notifications',
        value: 'true',
        description: 'Enable or disable email notifications'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable or disable maintenance mode'
      },
      {
        key: 'theme_color',
        value: '#72d1a8',
        description: 'Primary theme color'
      }
    ]);
    console.log('Default settings created successfully!');

    // Create sample todo items for admin
    console.log('Creating sample todos...');
    await models.Todo.bulkCreate([
      {
        user_id: adminId,
        title: 'Welcome to Planner Buddy',
        description: 'This is a sample todo item to get you started.',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        is_completed: false,
        priority: 'high',
        tags: 'welcome,sample'
      },
      {
        user_id: adminId,
        title: 'Customize your profile',
        description: 'Update your profile settings and timezone.',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        is_completed: false,
        priority: 'medium',
        tags: 'setup,profile'
      }
    ]);
    console.log('Sample todos created successfully!');

    // Create sample appointment for admin
    console.log('Creating sample appointment...');
    await models.Appointment.create({
      user_id: adminId,
      title: 'First Team Meeting',
      description: 'Introductory meeting with the team.',
      start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour after start
      location: 'Online - Zoom',
      tags: 'meeting,team'
    });
    console.log('Sample appointment created successfully!');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

initDatabase(); 