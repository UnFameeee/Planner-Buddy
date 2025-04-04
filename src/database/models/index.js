const User = require('./user.model');
const Todo = require('./todo.model');
const Appointment = require('./appointment.model');
const Setting = require('./setting.model');
const EmailQueue = require('./email_queue.model');
const EmailProgress = require('./email_progress.model');
const EmailTemplate = require('./email_template.model');

// Define relationships
// User to Todo (One-to-Many)
User.hasMany(Todo, { 
  foreignKey: 'user_id',
  as: 'todos' 
});
Todo.belongsTo(User, { 
  foreignKey: 'user_id',
  as: 'user' 
});

// User to Appointment (One-to-Many)
User.hasMany(Appointment, { 
  foreignKey: 'user_id',
  as: 'appointments' 
});
Appointment.belongsTo(User, { 
  foreignKey: 'user_id',
  as: 'user' 
});

// User to EmailQueue (One-to-Many)
User.hasMany(EmailQueue, {
  foreignKey: 'user_id',
  as: 'emailQueues'
});
EmailQueue.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Appointment to EmailQueue (One-to-Many)
Appointment.hasMany(EmailQueue, {
  foreignKey: 'appointment_id',
  as: 'emailQueues'
});
EmailQueue.belongsTo(Appointment, {
  foreignKey: 'appointment_id',
  as: 'appointment'
});

// EmailQueue to EmailProgress (One-to-Many)
EmailQueue.hasMany(EmailProgress, {
  foreignKey: 'email_queue_id',
  as: 'emailProgresses'
});
EmailProgress.belongsTo(EmailQueue, {
  foreignKey: 'email_queue_id',
  as: 'emailQueue'
});

// User to EmailProgress (One-to-Many)
User.hasMany(EmailProgress, {
  foreignKey: 'user_id',
  as: 'emailProgresses'
});
EmailProgress.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Appointment to EmailProgress (One-to-Many)
Appointment.hasMany(EmailProgress, {
  foreignKey: 'appointment_id',
  as: 'emailProgresses'
});
EmailProgress.belongsTo(Appointment, {
  foreignKey: 'appointment_id',
  as: 'appointment'
});

// Todo to EmailQueue (One-to-Many)
Todo.hasMany(EmailQueue, {
  foreignKey: 'todo_id',
  as: 'emailQueues'
});
EmailQueue.belongsTo(Todo, {
  foreignKey: 'todo_id',
  as: 'todo'
});

module.exports = {
  User,
  Todo,
  Appointment,
  Setting,
  EmailProgress,
  EmailQueue,
  EmailTemplate
}; 