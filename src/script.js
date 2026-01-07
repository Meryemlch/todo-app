// API URLs
const API_URL = '/api/tasks';
const CALENDAR_API = '/api/calendar';
const AUTH_API = '/api/auth';

// State
let currentTasks = [];
let currentEvents = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let deleteTarget = null;
let deleteType = null;

// Category labels
const categoryLabels = {
  general: 'Général',
  work: 'Travail',
  personal: 'Personnel',
  shopping: 'Courses',
  health: 'Santé'
};

// Priority labels
const priorityLabels = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse'
};

// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch(`${AUTH_API}/me`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      window.location.href = '/login.html';
      return false;
    }
    
    const data = await response.json();
    if (data.user) {
      document.getElementById('userEmail').textContent = data.user.email;
      document.getElementById('userInitial').textContent = data.user.email.charAt(0).toUpperCase();
    }
    return true;
  } catch (error) {
    window.location.href = '/login.html';
    return false;
  }
}

// Logout
async function logout() {
  try {
    await fetch(`${AUTH_API}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  window.location.href = '/login.html';
}

// Toggle sidebar on mobile
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('-translate-x-full');
}

// Show section
function showSection(section) {
  // Hide all sections
  document.querySelectorAll('section[id^="section-"]').forEach(s => s.classList.add('hidden'));
  
  // Show selected section
  document.getElementById(`section-${section}`).classList.remove('hidden');
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`nav-${section}`).classList.add('active');
  
  // Close sidebar on mobile
  if (window.innerWidth < 1024) {
    document.getElementById('sidebar').classList.add('-translate-x-full');
  }
  
  // Load section data
  if (section === 'calendar') {
    renderCalendar();
    loadEvents();
  } else if (section === 'stats') {
    updateStats();
  }
}

// ==================== TASKS ====================

// Load tasks
async function loadTasks() {
  const search = document.getElementById('searchInput').value;
  const category = document.getElementById('filterCategory').value;
  const priority = document.getElementById('filterPriority').value;
  
  let url = API_URL;
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (priority) params.append('priority', priority);
  if (params.toString()) url += `?${params.toString()}`;
  
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      throw new Error('Failed to load tasks');
    }
    
    currentTasks = await response.json();
    renderTasks();
    updateStats();
  } catch (error) {
    console.error('Error loading tasks:', error);
    showToast('Erreur lors du chargement des tâches', 'error');
  }
}

// Render tasks
function renderTasks() {
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  
  if (currentTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  taskList.innerHTML = currentTasks.map((task, index) => `
    <div class="task-card ${task.completed ? 'completed' : ''} animate-slide-in" style="animation-delay: ${index * 0.05}s">
      <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="task-title font-medium text-gray-800 truncate">${escapeHtml(task.title)}</h3>
        ${task.description ? `<p class="text-sm text-gray-500 truncate">${escapeHtml(task.description)}</p>` : ''}
        <div class="flex flex-wrap gap-2 mt-2">
          <span class="priority-badge priority-${task.priority}">${priorityLabels[task.priority] || task.priority}</span>
          <span class="category-badge">${categoryLabels[task.category] || task.category}</span>
          ${task.due_date ? `<span class="text-xs text-gray-400">${formatDate(task.due_date)}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="editTask(${task.id})" class="action-btn" title="Modifier">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        <button onclick="openDeleteModal(${task.id}, 'task')" class="action-btn delete" title="Supprimer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Toggle task completion
async function toggleTask(id) {
  const task = currentTasks.find(t => t.id === id);
  if (!task) return;
  
  try {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ completed: !task.completed })
    });
    loadTasks();
  } catch (error) {
    showToast('Erreur lors de la mise à jour', 'error');
  }
}

// Open task modal
function openTaskModal(taskId = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  const title = document.getElementById('taskModalTitle');
  
  form.reset();
  document.getElementById('taskId').value = '';
  
  if (taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (task) {
      title.textContent = 'Modifier la tâche';
      document.getElementById('taskId').value = task.id;
      document.getElementById('taskTitle').value = task.title;
      document.getElementById('taskDescription').value = task.description || '';
      document.getElementById('taskDueDate').value = task.due_date ? task.due_date.split('T')[0] : '';
      document.getElementById('taskPriority').value = task.priority;
      document.getElementById('taskCategory').value = task.category;
    }
  } else {
    title.textContent = 'Nouvelle tâche';
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.getElementById('taskTitle').focus();
}

function closeTaskModal() {
  const modal = document.getElementById('taskModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function editTask(id) {
  openTaskModal(id);
}

// Save task
document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const taskId = document.getElementById('taskId').value;
  const data = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    dueDate: document.getElementById('taskDueDate').value || null,
    priority: document.getElementById('taskPriority').value,
    category: document.getElementById('taskCategory').value
  };
  
  try {
    if (taskId) {
      await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      showToast('Tâche modifiée avec succès', 'success');
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      showToast('Tâche créée avec succès', 'success');
    }
    closeTaskModal();
    loadTasks();
  } catch (error) {
    showToast('Erreur lors de la sauvegarde', 'error');
  }
});

// ==================== CALENDAR ====================

// Render calendar
function renderCalendar() {
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  
  const grid = document.getElementById('calendarGrid');
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  
  let html = '';
  
  // Empty cells for days before first of month
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day opacity-30"></div>';
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasEvent = currentEvents.some(e => e.event_date === dateStr);
    const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    
    html += `
      <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" 
           onclick="selectDate('${dateStr}')">
        <span class="text-sm font-medium">${day}</span>
      </div>
    `;
  }
  
  grid.innerHTML = html;
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
  loadEvents();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
  loadEvents();
}

function selectDate(dateStr) {
  document.getElementById('eventDate').value = dateStr;
  openEventModal();
}

// Load events
async function loadEvents() {
  try {
    const response = await fetch(`${CALENDAR_API}/month/${currentYear}/${currentMonth + 1}`, {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Failed to load events');
    
    currentEvents = await response.json();
    renderCalendar();
    renderEvents();
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

// Render events list
function renderEvents() {
  const eventsList = document.getElementById('eventsList');
  const emptyEvents = document.getElementById('emptyEvents');
  
  if (currentEvents.length === 0) {
    eventsList.innerHTML = '';
    emptyEvents.classList.remove('hidden');
    return;
  }
  
  emptyEvents.classList.add('hidden');
  
  eventsList.innerHTML = currentEvents.map(event => `
    <div class="event-card">
      <div class="event-color-dot" style="background: ${event.color || '#8b5cf6'}"></div>
      <div class="flex-1 min-w-0">
        <h4 class="font-medium text-gray-800">${escapeHtml(event.title)}</h4>
        <p class="text-sm text-gray-500">${formatDate(event.event_date)} ${event.event_time || ''}</p>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="editEvent(${event.id})" class="action-btn" title="Modifier">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        <button onclick="openDeleteModal(${event.id}, 'event')" class="action-btn delete" title="Supprimer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Event modal
function openEventModal(eventId = null) {
  const modal = document.getElementById('eventModal');
  const form = document.getElementById('eventForm');
  const title = document.getElementById('eventModalTitle');
  
  form.reset();
  document.getElementById('eventId').value = '';
  selectEventColor('#8b5cf6');
  
  if (eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (event) {
      title.textContent = 'Modifier l\'événement';
      document.getElementById('eventId').value = event.id;
      document.getElementById('eventTitle').value = event.title;
      document.getElementById('eventDescription').value = event.description || '';
      document.getElementById('eventDate').value = event.event_date;
      document.getElementById('eventTime').value = event.event_time || '';
      selectEventColor(event.color || '#8b5cf6');
    }
  } else {
    title.textContent = 'Nouvel événement';
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.getElementById('eventTitle').focus();
}

function closeEventModal() {
  const modal = document.getElementById('eventModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function editEvent(id) {
  openEventModal(id);
}

function selectEventColor(color, evt) {
  document.getElementById('eventColor').value = color;
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-offset-2');
    btn.style.removeProperty('--tw-ring-color');
  });
  if (evt && evt.target) {
    evt.target.classList.add('ring-2', 'ring-offset-2');
  }
}

// Save event
document.getElementById('eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const eventId = document.getElementById('eventId').value;
  const data = {
    title: document.getElementById('eventTitle').value,
    description: document.getElementById('eventDescription').value,
    eventDate: document.getElementById('eventDate').value,
    eventTime: document.getElementById('eventTime').value || null,
    color: document.getElementById('eventColor').value
  };
  
  try {
    if (eventId) {
      await fetch(`${CALENDAR_API}/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      showToast('Événement modifié avec succès', 'success');
    } else {
      await fetch(CALENDAR_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      showToast('Événement créé avec succès', 'success');
    }
    closeEventModal();
    loadEvents();
  } catch (error) {
    showToast('Erreur lors de la sauvegarde', 'error');
  }
});

// ==================== DELETE ====================

function openDeleteModal(id, type) {
  deleteTarget = id;
  deleteType = type;
  const modal = document.getElementById('deleteModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  deleteTarget = null;
  deleteType = null;
}

async function confirmDelete() {
  if (!deleteTarget || !deleteType) return;
  
  const api = deleteType === 'task' ? API_URL : CALENDAR_API;
  
  try {
    await fetch(`${api}/${deleteTarget}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    showToast(`${deleteType === 'task' ? 'Tâche' : 'Événement'} supprimé`, 'success');
    closeDeleteModal();
    
    if (deleteType === 'task') {
      loadTasks();
    } else {
      loadEvents();
    }
  } catch (error) {
    showToast('Erreur lors de la suppression', 'error');
  }
}

// ==================== STATS ====================

function updateStats() {
  const total = currentTasks.length;
  const completed = currentTasks.filter(t => t.completed).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statRate').textContent = `${rate}%`;
  
  // Category stats
  const categories = {};
  currentTasks.forEach(task => {
    if (!categories[task.category]) {
      categories[task.category] = { total: 0, completed: 0 };
    }
    categories[task.category].total++;
    if (task.completed) categories[task.category].completed++;
  });
  
  const categoryStats = document.getElementById('categoryStats');
  categoryStats.innerHTML = Object.entries(categories).map(([cat, stats]) => {
    const percent = Math.round((stats.completed / stats.total) * 100);
    return `
      <div class="flex items-center gap-4">
        <div class="w-24 text-sm font-medium text-gray-600">${categoryLabels[cat] || cat}</div>
        <div class="flex-1 progress-bar">
          <div class="progress-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="w-20 text-sm text-gray-500 text-right">${stats.completed}/${stats.total}</div>
      </div>
    `;
  }).join('') || '<p class="text-gray-500 text-center">Aucune donnée disponible</p>';
}

// ==================== UTILITIES ====================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg class="w-5 h-5 ${type === 'success' ? 'text-green-500' : 'text-red-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      ${type === 'success' 
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'}
    </svg>
    <span class="text-gray-800">${message}</span>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Search/filter event listeners
document.getElementById('searchInput').addEventListener('input', debounce(loadTasks, 300));
document.getElementById('filterCategory').addEventListener('change', loadTasks);
document.getElementById('filterPriority').addEventListener('change', loadTasks);

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize app
async function init() {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    loadTasks();
  }
}

// Start the app
init();