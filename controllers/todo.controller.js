const todoService = require('../services/todo.service');
const settingService = require('../services/setting.service');

// Get all todos for current user
const getAllTodos = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Extract query parameters for filtering, pagination, and sorting
    const { status, priority, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Get todos with options
    const result = await todoService.getUserTodos(userId, {
      status,
      priority,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || 'due_date',
      sortOrder: sortOrder || 'ASC'
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single todo by ID
const getTodoById = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = req.params.id;
    
    // Get todo
    const todo = await todoService.getTodoById(todoId, userId);
    
    return res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new todo
const createTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoData = req.body;
    
    // Validate required fields
    if (!todoData.title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required for todo'
      });
    }
    
    // Create todo
    const newTodo = await todoService.createTodo(todoData, userId);
    
    return res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: newTodo
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update an existing todo
const updateTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = req.params.id;
    const todoData = req.body;
    
    // Update todo
    const updatedTodo = await todoService.updateTodo(todoId, todoData, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Todo updated successfully',
      data: updatedTodo
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a todo
const deleteTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = req.params.id;
    
    // Delete todo
    const result = await todoService.deleteTodo(todoId, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Mark todo as completed
const markAsCompleted = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = req.params.id;
    const { isCompleted = true } = req.body;
    
    // Mark todo as completed
    const updatedTodo = await todoService.markTodoAsCompleted(todoId, userId, isCompleted);
    
    return res.status(200).json({
      success: true,
      message: `Todo marked as ${isCompleted ? 'completed' : 'incomplete'}`,
      data: updatedTodo
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Render todos page
const renderTodosPage = async (req, res) => {
  try {
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    res.render('todos/index', {
      title: `Todos | ${appName}`,
      themeColor,
      user: req.user
    });
  } catch (error) {
    res.render('error', {
      message: 'Error loading todos page',
      error
    });
  }
};

// Render create todo page
const renderCreateTodoPage = async (req, res) => {
  try {
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    res.render('todos/create', {
      title: `Create Todo | ${appName}`,
      themeColor,
      user: req.user
    });
  } catch (error) {
    res.render('error', {
      message: 'Error loading create todo page',
      error
    });
  }
};

// Render edit todo page
const renderEditTodoPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = req.params.id;
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    // Get todo
    const todo = await todoService.getTodoById(todoId, userId);
    
    res.render('todos/edit', {
      title: `Edit Todo | ${appName}`,
      themeColor,
      user: req.user,
      todo
    });
  } catch (error) {
    res.render('error', {
      message: 'Error loading edit todo page',
      error
    });
  }
};

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  markAsCompleted,
  renderTodosPage,
  renderCreateTodoPage,
  renderEditTodoPage
}; 