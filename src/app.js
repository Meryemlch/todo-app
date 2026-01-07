// Fichier principal qui configure et lance le serveur

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares (traitements appliqués à chaque requête)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration with SQLite store
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.resolve(__dirname, '..')
  }),
  secret: process.env.SESSION_SECRET || 'todo-app-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use(express.static('public'));
app.use('/src', express.static(path.join(__dirname)));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);

// Route principale - redirige vers login si non authentifié
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Health check - vérifie que le serveur est en vie
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Démarre le serveur seulement si ce fichier est exécuté directement
// (pas lors des tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
  });
}

// Exporte l'app pour les tests
module.exports = app;