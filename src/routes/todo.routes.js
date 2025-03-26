const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controller');

// View Routes - must be placed before parameterized routes
router.get('/create', todoController.renderCreateTodoPage);
router.get('/all', todoController.renderTodosPage);
router.get('/edit/:id', todoController.renderEditTodoPage);

// API Routes
router.get('/', todoController.getAllTodos);
router.post('/', todoController.createTodo);
router.get('/:id', todoController.getTodoById);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);
router.patch('/:id/complete', todoController.markAsCompleted);

module.exports = router; 