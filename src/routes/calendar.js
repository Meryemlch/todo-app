const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/calendarModel');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(requireAuth);

// GET /api/calendar - Get all events
router.get('/', (req, res) => {
  const userId = req.session.userId;
  CalendarEvent.getAll(userId, (err, events) => {
    if (err) return res.status(500).json({ error: 'Error fetching events' });
    res.json(events);
  });
});

// GET /api/calendar/month/:year/:month - Get events for specific month
router.get('/month/:year/:month', (req, res) => {
  const userId = req.session.userId;
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);
  
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  CalendarEvent.getByMonth(userId, year, month, (err, events) => {
    if (err) return res.status(500).json({ error: 'Error fetching events' });
    res.json(events);
  });
});

// GET /api/calendar/:id - Get single event
router.get('/:id', (req, res) => {
  const userId = req.session.userId;
  CalendarEvent.getById(req.params.id, userId, (err, event) => {
    if (err) return res.status(500).json({ error: 'Error fetching event' });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  });
});

// POST /api/calendar - Create event
router.post('/', (req, res) => {
  const userId = req.session.userId;
  const { title, eventDate } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  if (!eventDate) {
    return res.status(400).json({ error: 'Event date is required' });
  }
  
  CalendarEvent.create(userId, req.body, (err, event) => {
    if (err) return res.status(500).json({ error: 'Error creating event' });
    res.status(201).json(event);
  });
});

// PUT /api/calendar/:id - Update event
router.put('/:id', (req, res) => {
  const userId = req.session.userId;
  CalendarEvent.update(req.params.id, userId, req.body, (err, event) => {
    if (err) return res.status(500).json({ error: 'Error updating event' });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  });
});

// DELETE /api/calendar/:id - Delete event
router.delete('/:id', (req, res) => {
  const userId = req.session.userId;
  CalendarEvent.delete(req.params.id, userId, (err, success) => {
    if (err) return res.status(500).json({ error: 'Error deleting event' });
    if (!success) return res.status(404).json({ error: 'Event not found' });
    res.status(204).send();
  });
});

module.exports = router;
