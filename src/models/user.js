const db = require('../database');
const bcrypt = require('bcrypt');

const User = {
  create: (email, password, callback) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return callback(err);
      
      const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
      db.run(sql, [email, hash], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, email });
      });
    });
  },

  findByEmail: (email, callback) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) return callback(err);
      callback(null, row);
    });
  },

  findById: (id, callback) => {
    const sql = 'SELECT id, email FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) return callback(err);
      callback(null, row);
    });
  }
};

module.exports = User;
