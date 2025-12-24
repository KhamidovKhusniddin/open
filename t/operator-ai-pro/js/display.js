// Display Screen JavaScript

const DisplayApp = {
    branchId: 'branch_001', // Demo - would be configured

    init() {
        this.loadBranchInfo();
        this.updateTime();
        this.loadServingQueues();
        this.loadStats();
        this.startRealTimeUpdates();

        // Update time every second
        setInterval(() => this.updateTime(), 1000);
    },

    loadBranchInfo() {
        const branch = Database.getBranch(this.branchId);
        if (!branch) return;

        const org = Database.getOrganization(branch.organizationId);
        document.getElementById('display-org').textContent = org?.name || 'Organization';
    },

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('display-time').textContent = timeString;
    },

    loadServingQueues() {
        const serving = QueueManager.getCurrentlyServing(this.branchId);
        const grid = document.getElementById('serving-grid');

        if (serving.length === 0) {
            grid.innerHTML = `
        <div class="no-serving">
          <div class="no-serving-icon">⏸️</div>
          <p>Hozircha xizmat ko'rsatilmayapti</p>
        </div>
      `;
            return;
        }

        grid.innerHTML = serving.map(queue => `
      <div class="serving-card">
        <div class="serving-number">${queue.queueNumber}</div>
        <div class="serving-arrow">→</div>
        <div class="serving-counter">${queue.counter || 'Counter'}</div>
      </div>
    `).join('');
    },

    loadStats() {
        const stats = QueueManager.getStatistics(this.branchId);

        document.getElementById('waiting-count').textContent = stats.waiting;
        document.getElementById('completed-count').textContent = stats.completed;
    },

    startRealTimeUpdates() {
        QueueManager.subscribe(() => {
            this.loadServingQueues();
            this.loadStats();
        });

        // Auto-refresh every 3 seconds
        setInterval(() => {
            this.loadServingQueues();
            this.loadStats();
        }, CONFIG.display.refreshInterval || 3000);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    DisplayApp.init();
});
