const User = require('./user.model');
const Todo = require('./todo.model');
const Appointment = require('./appointment.model');
const Setting = require('./setting.model');

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

module.exports = {
  User,
  Todo,
  Appointment,
  Setting
}; 