// Staff Panel JavaScript

const StaffApp = {
    staffId: 'staff_001', // Demo - would come from login
    currentQueue: null,
    branchId: null,
    serviceIds: [],

    init() {
        this.loadStaffInfo();
        this.loadWaitingQueue();
        this.loadStats();
        this.startRealTimeUpdates();
    },

    loadStaffInfo() {
        const staff = Database.getStaffMember(this.staffId);
        if (!staff) return;

        this.branchId = staff.branchId;
        this.serviceIds = staff.services;

        document.getElementById('staff-name').textContent = staff.name;
        document.getElementById('staff-counter').textContent = staff.counter;

        // Load current queue if exists
        if (staff.currentQueue) {
            this.currentQueue = Database.getQueue(staff.currentQueue);
            this.displayCurrentQueue();
        }
    },

    displayCurrentQueue() {
        const display = document.getElementById('current-queue-display');

        if (!this.currentQueue) {
            display.innerHTML = `
        <div class="no-queue">
          <div class="no-queue-icon">📭</div>
          <p data-i18n="no_current_queue">Hozirda navbat yo'q</p>
          <button class="btn btn-primary btn-lg" onclick="StaffApp.callNext()">
            <span>📞</span>
            <span data-i18n="call_next">Keyingisini chaqirish</span>
          </button>
        </div>
      `;
            return;
        }

        const service = Database.getService(this.currentQueue.serviceId);

        display.innerHTML = `
      <div class="current-queue-card">
        <div class="queue-number-display">${this.currentQueue.queueNumber}</div>
        <div class="queue-service">${service?.name || 'Service'}</div>
        <div class="queue-actions">
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
    },

    loadWaitingQueue() {
        const waiting = Database.getQueues({
            branchId: this.branchId,
            status: 'waiting'
        }).filter(q => this.serviceIds.includes(q.serviceId));

        const list = document.getElementById('waiting-list');
        const count = document.getElementById('waiting-count');

        count.textContent = waiting.length;

        if (waiting.length === 0) {
            list.innerHTML = '<p class="text-center p-lg" style="color: var(--gray-600);">Navbat yo\'q</p>';
            return;
        }

        list.innerHTML = waiting.map(queue => {
            const service = Database.getService(queue.serviceId);
            const time = Utils.formatDate(queue.createdAt, 'time');

            return `
        <div class="waiting-item">
          <div>
            <div class="waiting-number">${queue.queueNumber}</div>
            <div class="waiting-service">${service?.name || 'Service'}</div>
            <div class="waiting-time">${time}</div>
          </div>
        </div>
      `;
        }).join('');
    },

    callNext() {
        // Find a service to call from
        const serviceId = this.serviceIds[0]; // For demo, use first service

        const queue = QueueManager.callNext(this.branchId, serviceId, this.staffId);

        if (queue) {
            this.currentQueue = queue;
            this.displayCurrentQueue();
            this.loadWaitingQueue();
            Utils.showToast(`${Language.t('call_next')}: ${queue.queueNumber}`, 'success');
        } else {
            Utils.showToast(Language.t('no_data') || 'Navbat yo\'q', 'info');
        }
    },

    completeQueue() {
        if (!this.currentQueue) return;

        QueueManager.complete(this.currentQueue.id, this.staffId);
        this.currentQueue = null;
        this.displayCurrentQueue();
        this.loadWaitingQueue();
        this.loadStats();
    },

    markNoShow() {
        if (!this.currentQueue) return;

        QueueManager.markNoShow(this.currentQueue.id, this.staffId);
        this.currentQueue = null;
        this.displayCurrentQueue();
        this.loadWaitingQueue();
        this.loadStats();
    },

    loadStats() {
        const performance = QueueManager.getStaffPerformance(this.staffId);

        document.getElementById('stat-served').textContent = performance.completed;
        document.getElementById('stat-avg-time').textContent = performance.avgServiceTime;
    },

    startRealTimeUpdates() {
        QueueManager.subscribe(() => {
            this.loadWaitingQueue();

            // Check if current queue was updated
            if (this.currentQueue) {
                const updated = Database.getQueue(this.currentQueue.id);
                if (updated && updated.status !== this.currentQueue.status) {
                    this.currentQueue = updated;
                    this.displayCurrentQueue();
                }
            }
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    StaffApp.init();
});
