const db = require('../database');

const CalendarEvent = {
  getAll: (userId, callback) => {
    const sql = 'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY event_date ASC, event_time ASC';
    db.all(sql, [userId], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows);
    });
  },

  getByMonth: (userId, year, month, callback) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    
    const sql = `SELECT * FROM calendar_events 
                 WHERE user_id = ? AND event_date >= ? AND event_date < ?
                 ORDER BY event_date ASC, event_time ASC`;
    
    db.all(sql, [userId, startDate, endDate], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows);
    });
  },

  getById: (id, userId, callback) => {
    const sql = 'SELECT * FROM calendar_events WHERE id = ? AND user_id = ?';
    db.get(sql, [id, userId], (err, row) => {
      if (err) return callback(err);
      callback(null, row);
    });
  },

  create: (userId, eventData, callback) => {
    const { title, description, eventDate, eventTime, color } = eventData;
    const sql = `INSERT INTO calendar_events (user_id, title, description, event_date, event_time, color) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [userId, title, description, eventDate, eventTime, color || '#8b5cf6'], function(err) {
      if (err) return callback(err);
      callback(null, { 
        id: this.lastID, 
        userId, 
        ...eventData,
        createdAt: new Date() 
      });
    });
  },

  update: (id, userId, updates, callback) => {
    const fields = [];
    const values = [];
    
    const fieldMap = {
      title: 'title',
      description: 'description',
      eventDate: 'event_date',
      eventTime: 'event_time',
      color: 'color'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return callback(null, null);

    values.push(id, userId);
    const sql = `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;

    db.run(sql, values, function(err) {
      if (err) return callback(err);
      if (this.changes === 0) return callback(null, null);
      callback(null, { id, ...updates });
    });
  },

  delete: (id, userId, callback) => {
    const sql = 'DELETE FROM calendar_events WHERE id = ? AND user_id = ?';
    db.run(sql, [id, userId], function(err) {
      if (err) return callback(err);
      callback(null, this.changes > 0);
    });
  }
};

module.exports = CalendarEvent;
