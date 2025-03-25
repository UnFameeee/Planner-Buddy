const { Todo, User } = require('../database/models');
const { Op } = require('sequelize');
const { sendTodoReminder } = require('../utils/email.util');

// Get all todos for a user
const getUserTodos = async (userId, options = {}) => {
  try {
    const { status, priority, search, page = 1, limit = 10, sortBy = 'due_date', sortOrder = 'ASC' } = options;
    
    // Build filters
    const filters = { user_id: userId };
    
    // Filter by status (completed or not)
    if (status === 'completed') {
      filters.is_completed = true;
    } else if (status === 'pending') {
      filters.is_completed = false;
    }
    
    // Filter by priority
    if (priority) {
      filters.priority = priority;
    }
    
    // Search in title or description
    if (search) {
      filters[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get todos with pagination
    const { count, rows: todos } = await Todo.findAndCountAll({
      where: filters,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['deleted'] }
    });
    
    return {
      todos,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    };
  } catch (error) {
    throw new Error(`Error fetching todos: ${error.message}`);
  }
};

// Get a single todo by ID
const getTodoById = async (todoId, userId) => {
  try {
    const todo = await Todo.findOne({
      where: {
        id: todoId,
        user_id: userId
      }
    });
    
    if (!todo) {
      throw new Error('Todo not found or access denied');
    }
    
    return todo;
  } catch (error) {
    throw new Error(`Error fetching todo: ${error.message}`);
  }
};

// Create a new todo
const createTodo = async (todoData, userId) => {
  try {
    const newTodo = await Todo.create({
      ...todoData,
      user_id: userId
    });
    
    return newTodo;
  } catch (error) {
    throw new Error(`Error creating todo: ${error.message}`);
  }
};

// Update an existing todo
const updateTodo = async (todoId, todoData, userId) => {
  try {
    const todo = await Todo.findOne({
      where: {
        id: todoId,
        user_id: userId
      }
    });
    
    if (!todo) {
      throw new Error('Todo not found or access denied');
    }
    
    // Update todo
    await todo.update(todoData);
    
    return todo;
  } catch (error) {
    throw new Error(`Error updating todo: ${error.message}`);
  }
};

// Delete a todo
const deleteTodo = async (todoId, userId) => {
  try {
    const todo = await Todo.findOne({
      where: {
        id: todoId,
        user_id: userId
      }
    });
    
    if (!todo) {
      throw new Error('Todo not found or access denied');
    }
    
    // Soft delete the todo
    await todo.destroy();
    
    return { success: true, message: 'Todo deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting todo: ${error.message}`);
  }
};

// Mark todo as completed
const markTodoAsCompleted = async (todoId, userId, isCompleted = true) => {
  try {
    const todo = await Todo.findOne({
      where: {
        id: todoId,
        user_id: userId
      }
    });
    
    if (!todo) {
      throw new Error('Todo not found or access denied');
    }
    
    // Update completion status
    await todo.update({ is_completed: isCompleted });
    
    return todo;
  } catch (error) {
    throw new Error(`Error updating todo status: ${error.message}`);
  }
};

// Process reminders for todos
const processTodoReminders = async () => {
  try {
    const now = new Date();
    
    // Find todos with reminders due and not sent yet
    const dueTodos = await Todo.findAll({
      where: {
        reminder_time: { [Op.lte]: now },
        reminder_sent: false,
        is_completed: false
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'timezone']
      }]
    });
    
    for (const todo of dueTodos) {
      if (todo.user) {
        // Send reminder
        await sendTodoReminder(todo.user, todo);
        
        // Mark reminder as sent
        await todo.update({ reminder_sent: true });
      }
    }
    
    return { success: true, reminders_sent: dueTodos.length };
  } catch (error) {
    throw new Error(`Error processing todo reminders: ${error.message}`);
  }
};

module.exports = {
  getUserTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  markTodoAsCompleted,
  processTodoReminders
}; 