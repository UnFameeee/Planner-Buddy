const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// View Routes
router.get('/create', todoController.renderCreateTodoPage);
router.get('/all', todoController.renderTodosPage);
router.get('/edit/:id', todoController.renderEditTodoPage);

module.exports = router; 