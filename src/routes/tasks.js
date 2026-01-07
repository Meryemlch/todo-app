const express = require('express');
const router = express.Router();
const taskModel = require('../models/task');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(requireAuth);

// GET /api/tasks
router.get('/', (req, res) => {
  const userId = req.session.userId;
  const filters = {
    category: req.query.category,
    priority: req.query.priority,
    search: req.query.search
  };

  taskModel.getAll(userId, filters, (err, tasks) => {
    if (err) return res.status(500).json({ error: 'Error fetching tasks' });
    res.json(tasks);
  });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const userId = req.session.userId;
  taskModel.getById(req.params.id, userId, (err, task) => {
    if (err) return res.status(500).json({ error: 'Error fetching task' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const userId = req.session.userId;
  const { title } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  taskModel.create(userId, req.body, (err, task) => {
    if (err) return res.status(500).json({ error: 'Error creating task' });
    res.status(201).json(task);
  });
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const userId = req.session.userId;
  taskModel.update(req.params.id, userId, req.body, (err, task) => {
    if (err) return res.status(500).json({ error: 'Error updating task' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const userId = req.session.userId;
  taskModel.delete(req.params.id, userId, (err, success) => {
    if (err) return res.status(500).json({ error: 'Error deleting task' });
    if (!success) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  });
});

module.exports = router;