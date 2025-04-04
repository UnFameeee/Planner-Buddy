const { Todo, User } = require('../database/models');
const { Op, fn, col } = require('sequelize');
const { sendTodoReminder } = require('../utils/email.util');
const { sequelize } = require('../database');
const emailQueueService = require('./email_queue.service');

// Get all todos for a user
const getUserTodos = async (userId, options = {}) => {
  try {
    const { status, priority, search, page = 1, limit = 10, sortBy = 'due_date', sortOrder = 'ASC' } = options;
    
    console.log('Service - Input options:', { userId, status, priority, search, page, limit, sortBy, sortOrder });
    
    // Build filters
    const filters = { 
      user_id: userId,
      deleted: false // Ensure we only get non-deleted todos
    };
    
    // Filter by status (completed or not)
    if (status === 'completed') {
      filters.is_completed = true;
    } else if (status === 'pending') {
      filters.is_completed = false;
    }
    
    // Filter by priority
    if (priority) {
      console.log('Service - Filtering by priority:', priority);
      // Validate priority value
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority.toLowerCase())) {
        throw new Error(`Invalid priority value. Must be one of: ${validPriorities.join(', ')}`);
      }
      filters.priority = priority.toLowerCase();
    }
    
    // Search in title or description
    if (search) {
      filters[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    console.log('Service - Using filters:', filters);
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Validate sortBy field
    const validSortColumns = ['due_date', 'created_at', 'updated_at', 'title', 'priority', 'is_completed'];
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'due_date';
    const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    console.log('Service - Using sort:', { finalSortBy, finalSortOrder });
    
    // Get todos with pagination
    const { count, rows: todos } = await Todo.findAndCountAll({
      where: filters,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[finalSortBy, finalSortOrder]],
      attributes: { 
        exclude: ['deleted'],
        include: [
          [fn('COALESCE', col('due_date'), fn('NOW')), 'sort_date']
        ]
      },
      raw: false // Ensure we get Sequelize instances
    });
    
    console.log(`Service - Found ${count} todos`);
    
    return {
      todos,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    };
  } catch (error) {
    console.error('Service - Error in getUserTodos:', error);
    console.error('Service - Error stack:', error.stack);
    throw error; // Re-throw to be caught by controller
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
        try {
          // Thêm reminder vào email queue
          await emailQueueService.createTodoReminder(todo, todo.user);
          
          // Mark reminder as sent
          await todo.update({ reminder_sent: true });
          console.log(`Todo reminder queued successfully for todo ID: ${todo.id}`);
        } catch (error) {
          console.error(`Error creating todo reminder for todo ID: ${todo.id}:`, error);
        }
      }
    }
    
    return { success: true, reminders_sent: dueTodos.length };
  } catch (error) {
    throw new Error(`Error processing todo reminders: ${error.message}`);
  }
};

// Get todos by date
const getTodosByDate = async (userId, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const todos = await Todo.findAll({
      where: {
        user_id: userId,
        due_date: {
          [Op.between]: [startOfDay, endOfDay]
        },
        deleted: false
      },
      order: [['due_date', 'ASC']]
    });
    
    return todos;
  } catch (error) {
    throw new Error(`Error fetching todos by date: ${error.message}`);
  }
};

module.exports = {
  getUserTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  markTodoAsCompleted,
  processTodoReminders,
  getTodosByDate
}; 