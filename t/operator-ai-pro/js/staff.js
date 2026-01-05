// Staff Panel JavaScript

const StaffApp = {
  staffId: null,
  token: null,
  userInfo: null,
  currentQueue: null,

  init() {
    this.checkLogin();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });
  },

  checkLogin() {
    const token = localStorage.getItem('staff_token');
    if (token) {
      this.token = token;
      this.userInfo = JSON.parse(localStorage.getItem('staff_user') || '{}');
      this.staffId = this.userInfo.id; // User ID from user object
      document.getElementById('login-modal').style.display = 'none';
      this.loadStaffAuthInfo();
      this.startRealTimeUpdates();
    } else {
      document.getElementById('login-modal').style.display = 'flex';
    }
  },

  async login() {
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('staff_token', data.token);
        localStorage.setItem('staff_user', JSON.stringify(data.user));
        this.token = data.token;
        this.userInfo = data.user;
        document.getElementById('login-modal').style.display = 'none';
        this.loadStaffAuthInfo();
        this.startRealTimeUpdates();
      } else {
        errorEl.textContent = data.message || 'Login xatolik';
        errorEl.style.display = 'block';
      }
    } catch (e) {
      errorEl.textContent = 'Server bilan aloqa yo\'q';
      errorEl.style.display = 'block';
    }
  },

  loadStaffAuthInfo() {
    const nameEl = document.getElementById('staff-name');
    const badgeEl = document.querySelector('.staff-badge');
    const role = this.userInfo.role || 'staff';

    nameEl.textContent = this.userInfo.name || 'Doktor';

    if (role === 'admin' || role === 'system_admin') {
      badgeEl.textContent = 'Admin Mode';
      badgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
      badgeEl.style.color = 'var(--success-color)';
      badgeEl.style.borderColor = 'var(--success-color)';
    } else {
      badgeEl.textContent = 'Staff Mode';
    }

    document.getElementById('staff-counter').textContent = 'Xona #' + (this.userInfo.branch_id || '1');
    this.fetchCurrentQueue();
    this.loadWaitingQueue();
    this.fetchAnalytics();
  },

  async fetchCurrentQueue() {
    if (!this.token) return;
    try {
      const res = await fetch('/api/staff/current', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.currentQueue = data.queue;
        this.displayCurrentQueue();
        this.fetchPatientHistory();
      } else {
        this.currentQueue = null;
        this.displayCurrentQueue();
      }
    } catch (e) {
      console.error("Error fetching current queue", e);
    }
  },

  async fetchPatientHistory() {
    if (!this.currentQueue || !this.currentQueue.phone) return;

    try {
      const res = await fetch(`/api/staff/patient-history?phone=${encodeURIComponent(this.currentQueue.phone)}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success && data.history.length > 0) {
        const historyHtml = data.history.map(h => `
                  <div class="history-item">
                      <div class="history-meta">
                          <span class="history-date">${Utils.formatDate(h.created_at, 'short')}</span>
                          <span class="history-svc">${h.service_name || ''}</span>
                      </div>
                      <div class="history-notes">${h.notes || 'Izohsiz'}</div>
                  </div>
              `).join('');

        const notesSection = document.querySelector('.notes-section');
        if (notesSection) {
          let histDiv = document.getElementById('patient-history-view');
          if (!histDiv) {
            histDiv = document.createElement('div');
            histDiv.id = 'patient-history-view';
            histDiv.className = 'patient-history';
            notesSection.appendChild(histDiv);
          }
          histDiv.innerHTML = `<h4>Tashhislar tarixi:</h4>` + historyHtml;
        }
      }
    } catch (e) {
      console.error("Error fetching history", e);
    }
  },

  loadWaitingQueue() {
    this.fetchWaitingQueue();
  },

  async fetchWaitingQueue() {
    if (!this.token) return;

    try {
      const res = await fetch('/api/staff/queues', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();

      if (data.success) {
        const queues = data.queues.filter(q => q.status === 'waiting');
        const list = document.getElementById('waiting-list');
        const count = document.getElementById('waiting-count');

        count.textContent = queues.length;

        if (queues.length === 0) {
          list.innerHTML = '<div class="empty-list">Navbat bo\'sh</div>';
          return;
        }

        list.innerHTML = queues.map(queue => {
          const time = Utils.formatDate(queue.created_at || queue.createdAt, 'time');
          return `
                    <div class="waiting-item animate-fadeIn">
                        <div class="waiting-number">${queue.number || queue.queueNumber}</div>
                        <div class="waiting-details">
                            <div class="waiting-service">${queue.service_name || 'Xizmat'}</div>
                            <div class="waiting-time">${time}</div>
                        </div>
                    </div>
                `;
        }).join('');
      }
    } catch (e) {
      console.error("Error loading queues", e);
    }
  },

  displayCurrentQueue() {
    const display = document.getElementById('current-queue-display');

    if (!this.currentQueue) {
      display.innerHTML = `
        <div class="no-queue">
          <div class="no-queue-icon">📭</div>
          <p data-i18n="no_current_queue">Hozirda navbat yo'q</p>
          <button class="btn btn-primary btn-lg shine-effect" onclick="StaffApp.callNext()">
            <i class="icon-call">📞</i>
            <span data-i18n="call_next">Keyingisini chaqirish</span>
          </button>
        </div>
      `;
      return;
    }

    display.innerHTML = `
      <div class="current-queue-card">
        <div class="queue-number-display">${this.currentQueue.number || this.currentQueue.queueNumber}</div>
        <div class="queue-service">${this.currentQueue.service_name || 'Service'}</div>
        
        <!-- Notes Section -->
        <div class="notes-section" style="margin: 15px 0;">
            <textarea id="medical-notes" class="form-control" placeholder="Tibbiy izoh yoki tashxis..." rows="3">${this.currentQueue.notes || ''}</textarea>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn btn-sm btn-secondary" onclick="StaffApp.saveNotes()">💾 Saqlash</button>
            </div>
        </div>

        <div class="queue-actions">
          <button class="btn btn-transfer" onclick="StaffApp.openTransferModal()">
            <i class="fas fa-random"></i>
            <span>Yo'naltirish</span>
          </button>
          <button class="btn btn-success btn-lg" onclick="StaffApp.completeQueue()">
            <span>✓</span>
            <span data-i18n="mark_completed">Bajarildi</span>
          </button>
          <button class="btn btn-danger" onclick="StaffApp.markNoShow()">
            <span>✕</span>
            <span data-i18n="mark_no_show">Kelmadi</span>
          </button>
        </div>
      </div>
    `;

    // Auto-init translations for new content
    if (typeof Language !== 'undefined') Language.updatePageLanguage();
  },

  // Analytics Logic
  hourlyChart: null,
  serviceChart: null,

  async fetchAnalytics() {
    if (!this.token) return;
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.updateCharts(data.data);
      }
    } catch (e) {
      console.error("Error fetching analytics", e);
    }
  },

  updateCharts(data) {
    const ctxHourly = document.getElementById('hourlyTrafficChart')?.getContext('2d');
    const ctxService = document.getElementById('serviceUsageChart')?.getContext('2d');
    if (!ctxHourly || !ctxService) return;

    const hourlyLabels = Object.keys(data.hourly).sort();
    const hourlyValues = hourlyLabels.map(h => data.hourly[h]);

    const serviceLabels = Object.keys(data.services);
    const serviceValues = serviceLabels.map(s => data.services[s]);

    // Hourly Chart
    if (this.hourlyChart) this.hourlyChart.destroy();
    this.hourlyChart = new Chart(ctxHourly, {
      type: 'line',
      data: {
        labels: hourlyLabels.map(h => `${h}:00`),
        datasets: [{
          label: 'Mijozlar soni',
          data: hourlyValues,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });

    // Service Chart
    if (this.serviceChart) this.serviceChart.destroy();
    this.serviceChart = new Chart(ctxService, {
      type: 'doughnut',
      data: {
        labels: serviceLabels,
        datasets: [{
          data: serviceValues,
          backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  },

  async callNext() {
    try {
      const res = await fetch('/api/staff/call-next', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.currentQueue = data.queue;
        this.displayCurrentQueue();
        this.fetchWaitingQueue();
        this.fetchPatientHistory();
        Utils.showToast("Mijoz chaqirildi", "success");
      } else {
        Utils.showToast(data.message || "Navbat yo'q", "info");
      }
    } catch (e) {
      Utils.showToast("Tarmoq xatoligi", "error");
    }
  },

  async completeQueue() {
    if (!this.currentQueue) return;
    try {
      const res = await fetch('/api/staff/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ queue_id: this.currentQueue.id })
      });
      if (res.ok) {
        Utils.showToast("Xizmat yakunlandi", "success");
        this.currentQueue = null;
        this.displayCurrentQueue();
        this.fetchWaitingQueue();
      }
    } catch (e) {
      Utils.showToast("Xatolik", "error");
    }
  },

  async markNoShow() {
    if (!this.currentQueue) return;
    try {
      const res = await fetch('/api/staff/no-show', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ queue_id: this.currentQueue.id })
      });
      if (res.ok) {
        Utils.showToast("Mijoz kelmadi deb belgilandi", "warning");
        this.currentQueue = null;
        this.displayCurrentQueue();
        this.fetchWaitingQueue();
      }
    } catch (e) {
      Utils.showToast("Xatolik", "error");
    }
  },

  async saveNotes() {
    const notes = document.getElementById('medical-notes').value;
    const res = await fetch('/api/update_notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        queue_id: this.currentQueue.id,
        notes: notes
      })
    });
    if (res.ok) {
      Utils.showToast("Izoh saqlandi", "success");
    }
  },

  async openTransferModal() {
    // Fetch actual services for branch if possible, else use demo
    const services = [
      { id: 'svc_lab', name: 'Laboratoriya' },
      { id: 'svc_uzi', name: 'UZI' },
      { id: 'svc_xray', name: 'Rentgen' }
    ];

    let msg = "Qaysi bo'limga yuborasiz?\n\n";
    services.forEach((s, i) => msg += `${i + 1}. ${s.name}\n`);
    const choice = prompt(msg + "\nTanlang (1, 2, 3...):");

    if (choice && services[choice - 1]) {
      const selectedSvc = services[choice - 1];
      const res = await fetch('/api/transfer_patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          queue_id: this.currentQueue.id,
          service_id: selectedSvc.id,
          notes: document.getElementById('medical-notes').value
        })
      });

      if (res.ok) {
        Utils.showToast("Bemor yo'naltirildi", "success");
        this.currentQueue = null;
        this.displayCurrentQueue();
        this.fetchWaitingQueue();
      }
    }
  },

  logout() {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
    location.reload();
  },

  loadStats() {
    // For now simple reload or fetch stats API if exists
  },

  startRealTimeUpdates() {
    // Initial load
    this.fetchWaitingQueue();
    // Refresh каждые 15s
    setInterval(() => {
      this.fetchWaitingQueue();
      if (!this.currentQueue) this.fetchCurrentQueue();
      this.fetchAnalytics();
    }, 15000);

    // Fix translations after a short delay to ensure DOM is ready
    setTimeout(() => {
      if (typeof Language !== 'undefined') Language.init();
    }, 500);
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  StaffApp.init();
});
