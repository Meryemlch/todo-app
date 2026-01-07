const request = require('supertest');
const app = require('../src/app');

// ==================== HEALTH CHECK TESTS ====================

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });
});

// ==================== AUTH API TESTS ====================

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 if both email and password are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Not authenticated');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should handle logout request', async () => {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});

// ==================== TASKS API TESTS ====================

describe('Task API', () => {
  describe('GET /api/tasks (unauthenticated)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/tasks (unauthenticated)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' });
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/tasks/:id (unauthenticated)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/tasks/1')
        .send({ completed: true });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/tasks/:id (unauthenticated)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).delete('/api/tasks/1');
      expect(response.status).toBe(401);
    });
  });
});

// ==================== CALENDAR API TESTS ====================

describe('Calendar API', () => {
  describe('GET /api/calendar (unauthenticated)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/calendar');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/calendar (unauthenticated)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/calendar')
        .send({ title: 'Test Event', eventDate: '2024-12-25' });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/calendar/month/:year/:month (unauthenticated)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/calendar/month/2024/12');
      expect(response.status).toBe(401);
    });
  });
});

// ==================== AUTHENTICATED FLOW TESTS ====================

describe('Authenticated User Flow', () => {
  let agent;
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    agent = request.agent(app);
    // Register a new user
    await agent
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });
  });

  describe('Task CRUD Operations', () => {
    let taskId;

    it('should create a new task', async () => {
      const response = await agent
        .post('/api/tasks')
        .send({ 
          title: 'Test Task',
          description: 'Test description',
          priority: 'high',
          category: 'work'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Task');
      expect(response.body.completed).toBe(false);
      taskId = response.body.id;
    });

    /**
     * it('should fail to create a task with empty title', async () => {
  const response = await agent
    .post('/api/tasks')
    .send({ 
      title: '',  // Titre vide
      description: 'No title task'
    });
  
  expect(response.status).toBe(201); // ❌ On attend 201 mais l’API renverra 400
});
     */

    it('should return 400 if title is missing', async () => {
      const response = await agent
        .post('/api/tasks')
        .send({ description: 'No title' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required');
    });

    it('should get all tasks', async () => {
      const response = await agent.get('/api/tasks');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get tasks filtered by category', async () => {
      const response = await agent.get('/api/tasks?category=work');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get tasks filtered by priority', async () => {
      const response = await agent.get('/api/tasks?priority=high');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update task completion status', async () => {
      const response = await agent
        .put(`/api/tasks/${taskId}`)
        .send({ completed: true });
      
      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    it('should update task title', async () => {
      const response = await agent
        .put(`/api/tasks/${taskId}`)
        .send({ title: 'Updated Task Title' });
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Task Title');
    });

    it('should delete a task', async () => {
      const response = await agent.delete(`/api/tasks/${taskId}`);
      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await agent.get('/api/tasks/99999');
      expect(response.status).toBe(404);
    });
  });

  describe('Calendar CRUD Operations', () => {
    let eventId;

    it('should create a new calendar event', async () => {
      const response = await agent
        .post('/api/calendar')
        .send({ 
          title: 'Test Meeting',
          eventDate: '2024-12-25',
          eventTime: '14:00',
          color: '#8b5cf6'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Meeting');
      eventId = response.body.id;
    });

    it('should return 400 if event title is missing', async () => {
      const response = await agent
        .post('/api/calendar')
        .send({ eventDate: '2024-12-25' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required');
    });

    it('should return 400 if event date is missing', async () => {
      const response = await agent
        .post('/api/calendar')
        .send({ title: 'Event without date' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Event date is required');
    });

    it('should get all calendar events', async () => {
      const response = await agent.get('/api/calendar');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get events for specific month', async () => {
      const response = await agent.get('/api/calendar/month/2024/12');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 for invalid month', async () => {
      const response = await agent.get('/api/calendar/month/2024/13');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid year or month');
    });

    it('should return 400 for invalid year', async () => {
      const response = await agent.get('/api/calendar/month/abc/12');
      expect(response.status).toBe(400);
    });

    it('should update a calendar event', async () => {
      const response = await agent
        .put(`/api/calendar/${eventId}`)
        .send({ title: 'Updated Meeting' });
      
      expect(response.status).toBe(200);
    });

    it('should delete a calendar event', async () => {
      const response = await agent.delete(`/api/calendar/${eventId}`);
      expect(response.status).toBe(204);
    });
  });

  describe('User Profile', () => {
    it('should get current user info', async () => {
      const response = await agent.get('/api/auth/me');
      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const response = await agent.post('/api/auth/logout');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should return 401 after logout', async () => {
      const response = await agent.get('/api/auth/me');
      expect(response.status).toBe(401);
    });
  });
});