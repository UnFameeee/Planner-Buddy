const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controller');
const { authenticate } = require('../utils/auth.middleware');

// Protect all routes with authentication
router.use(authenticate);

// View Routes - phải đặt trước các route có path param
router.get('/view/all', todoController.renderTodosPage);
router.get('/view/create', todoController.renderCreateTodoPage);
router.get('/view/edit/:id', todoController.renderEditTodoPage);

// API Routes
router.get('/', todoController.getAllTodos);
router.post('/', todoController.createTodo);
router.get('/:id', todoController.getTodoById);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);
router.patch('/:id/complete', todoController.markAsCompleted);

module.exports = router; 