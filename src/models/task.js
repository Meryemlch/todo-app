const db = require('../database');

const Task = {
  getAll: (userId, filters, callback) => {
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.priority) {
      sql += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.map(row => ({
        ...row,
        completed: !!row.completed // Convert 0/1 to boolean
      })));
    });
  },

  getById: (id, userId, callback) => {
    const sql = 'SELECT * FROM tasks WHERE id = ? AND user_id = ?';
    db.get(sql, [id, userId], (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(null, null);
      callback(null, {
        ...row,
        completed: !!row.completed
      });
    });
  },

  create: (userId, taskData, callback) => {
    const { title, description, dueDate, priority, category } = taskData;
    const sql = `INSERT INTO tasks (user_id, title, description, due_date, priority, category) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [userId, title, description, dueDate, priority || 'medium', category || 'general'], function(err) {
      if (err) return callback(err);
      callback(null, { 
        id: this.lastID, 
        userId, 
        ...taskData, 
        completed: false,
        createdAt: new Date() 
      });
    });
  },

  update: (id, userId, updates, callback) => {
    // Construct dynamic update query
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'completed') {
        fields.push(`${key} = ?`);
        values.push(value ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return callback(null, null);

    values.push(id, userId);
    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;

    db.run(sql, values, function(err) {
      if (err) return callback(err);
      if (this.changes === 0) return callback(null, null); // Nothing updated
      callback(null, { id, ...updates });
    });
  },

  delete: (id, userId, callback) => {
    const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    db.run(sql, [id, userId], function(err) {
      if (err) return callback(err);
      callback(null, this.changes > 0);
    });
  }
};

module.exports = Task;