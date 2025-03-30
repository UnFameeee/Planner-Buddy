const express = require('express');
const router = express.Router();
const todoController = require('../../controllers/todo.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// API Routes
router.get('/', todoController.getAllTodos);
router.post('/', todoController.createTodo);
router.get('/:id', todoController.getTodoById);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);
router.patch('/:id/complete', todoController.markAsCompleted);

module.exports = router; 