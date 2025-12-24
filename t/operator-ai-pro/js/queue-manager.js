// Operator AI - Queue Manager
// Handles all queue operations and real-time updates

const QueueManager = {
    // Active listeners
    listeners: [],
    updateInterval: null,

    /**
     * Initialize queue manager
     */
    init() {
        // Start real-time updates
        this.startRealTimeUpdates();

        // Listen for database changes
        window.addEventListener('databaseChange', (e) => {
            if (e.detail.key === Database.keys.queues) {
                this.notifyListeners();
            }
        });
    },

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.notifyListeners();
        }, CONFIG.storage.syncInterval);
    },

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },

    /**
     * Subscribe to queue updates
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    },

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in queue listener:', error);
            }
        });
    },

    /**
     * Sync queue status with backend
     */
    syncStatus(queueId, status) {
        if (!queueId) return;
        fetch(`${CONFIG.api.verificationURL}/api/queues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: queueId,
                status: status
            })
        }).catch(err => console.error('Status sync failed:', err));
    },

    /**
     * Create new queue
     */
    createQueue(branchId, serviceId, customerInfo = {}) {
        const queue = Database.createQueue({
            branchId,
            serviceId,
            customerInfo,
            priority: customerInfo.priority || 1
        });

        if (queue) {
            Utils.showToast(Language.t('success_saved'), 'success');
            Utils.playSound('notification');
            this.notifyListeners();
        }

        return queue;
    },

    /**
     * Get next queue in line
     */
    getNextQueue(branchId, serviceId) {
        const queues = Database.getQueues({
            branchId,
            serviceId,
            status: 'waiting'
        });

        if (queues.length === 0) {
            return null;
        }

        // Sort by priority and creation time
        queues.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        return queues[0];
    },

    /**
     * Call next customer
     */
    callNext(branchId, serviceId, staffId) {
        const queue = Database.callNextQueue(branchId, serviceId, staffId);

        if (queue) {
            // Play announcement
            this.announceQueue(queue);

            // Show notification
            Utils.showToast(`${Language.t('call_next')}: ${queue.queueNumber}`, 'info');
            Utils.playSound('call');

            // Update staff current queue
            Database.updateStaff(staffId, { currentQueue: queue.id });

            // Sync status
            this.syncStatus(queue.id, 'called');

            this.notifyListeners();
        }

        return queue;
    },

    /**
     * Start serving customer
     */
    startServing(queueId) {
        const queue = Database.startServing(queueId);

        if (queue) {
            Utils.showToast(Language.t('status_serving'), 'info');
            this.syncStatus(queueId, 'serving');
            this.notifyListeners();
        }

        return queue;
    },

    /**
     * Complete queue
     */
    complete(queueId, staffId) {
        const queue = Database.completeQueue(queueId);

        if (queue) {
            // Clear staff current queue
            if (staffId) {
                Database.updateStaff(staffId, { currentQueue: null });
            }

            Utils.showToast(Language.t('status_completed'), 'success');
            Utils.playSound('success');
            this.syncStatus(queueId, 'completed');
            this.notifyListeners();
        }

        return queue;
    },

    /**
     * Mark as no-show
     */
    markNoShow(queueId, staffId) {
        const queue = Database.markNoShow(queueId);

        if (queue) {
            // Clear staff current queue
            if (staffId) {
                Database.updateStaff(staffId, { currentQueue: null });
            }

            Utils.showToast(Language.t('status_no_show'), 'warning');
            this.syncStatus(queueId, 'no-show');
            this.notifyListeners();
        }

        return queue;
    },

    /**
     * Cancel queue
     */
    cancel(queueId) {
        const queue = Database.cancelQueue(queueId);

        if (queue) {
            Utils.showToast(Language.t('status_cancelled'), 'warning');
            this.syncStatus(queueId, 'cancelled');
            this.notifyListeners();
        }

        return queue;
    },

    /**
     * Transfer queue to another service
     */
    transfer(queueId, newServiceId, newStaffId = null) {
        const queue = Database.updateQueue(queueId, {
            serviceId: newServiceId,
            staffId: newStaffId,
            status: 'waiting',
            calledAt: null,
            servedAt: null
        });

        if (queue) {
            Utils.showToast(Language.t('transfer') + ' ' + Language.t('success_saved'), 'info');
            this.notifyListeners();
        }

        return queue;
    },

    /**
     * Get queue position
     */
    getQueuePosition(queueId) {
        const queue = Database.getQueue(queueId);
        if (!queue || queue.status !== 'waiting') {
            return null;
        }

        const queues = Database.getQueues({
            branchId: queue.branchId,
            serviceId: queue.serviceId,
            status: 'waiting'
        });

        // Sort by priority and creation time
        queues.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        const position = queues.findIndex(q => q.id === queueId) + 1;
        return {
            position,
            total: queues.length,
            estimatedWaitTime: position * (Database.getService(queue.serviceId)?.estimatedDuration || 15)
        };
    },

    /**
     * Get currently serving queues
     */
    getCurrentlyServing(branchId = null) {
        const queues = Database.getQueues({
            branchId,
            status: 'serving'
        });

        return queues.map(queue => {
            const staff = Database.getStaffMember(queue.staffId);
            const service = Database.getService(queue.serviceId);
            return {
                ...queue,
                staffName: staff?.name,
                counter: staff?.counter,
                serviceName: service?.name
            };
        });
    },

    /**
     * Get waiting queues count
     */
    getWaitingCount(branchId, serviceId = null) {
        const filters = { branchId, status: 'waiting' };
        if (serviceId) {
            filters.serviceId = serviceId;
        }
        return Database.getQueues(filters).length;
    },

    /**
     * Announce queue number
     */
    announceQueue(queue) {
        if (!CONFIG.display.voiceEnabled) {
            return;
        }

        const staff = Database.getStaffMember(queue.staffId);
        const counter = staff?.counter || 'Counter';

        // Get announcement text based on language
        let text = '';
        const lang = Language.getLanguage();

        if (lang === 'uz') {
            text = `Navbat raqami ${queue.queueNumber}, ${counter}ga tashrif buyuring`;
        } else if (lang === 'ru') {
            text = `Номер очереди ${queue.queueNumber}, пожалуйста пройдите к ${counter}`;
        } else {
            text = `Queue number ${queue.queueNumber}, please proceed to ${counter}`;
        }

        Utils.speak(text, CONFIG.display.voiceLanguage);
    },

    /**
     * Get statistics
     */
    getStatistics(branchId = null, date = new Date()) {
        return Database.getStatistics(branchId, date);
    },

    /**
     * Get peak hours analysis
     */
    getPeakHours(branchId, date = new Date()) {
        const filterDate = new Date(date).toDateString();
        let queues = Database.getQueues({ branchId });

        // Filter by date
        queues = queues.filter(q => new Date(q.createdAt).toDateString() === filterDate);

        // Group by hour
        const hourlyData = {};
        for (let i = 0; i < 24; i++) {
            hourlyData[i] = 0;
        }

        queues.forEach(queue => {
            const hour = new Date(queue.createdAt).getHours();
            hourlyData[hour]++;
        });

        return hourlyData;
    },

    /**
     * Get staff performance
     */
    getStaffPerformance(staffId, date = new Date()) {
        const filterDate = new Date(date).toDateString();
        let queues = Database.getQueues({ staffId });

        // Filter by date
        queues = queues.filter(q => new Date(q.createdAt).toDateString() === filterDate);

        const completed = queues.filter(q => q.status === 'completed');
        const noShow = queues.filter(q => q.status === 'no-show');

        let avgServiceTime = 0;
        if (completed.length > 0) {
            const serviceTimes = completed.map(q =>
                Utils.getTimeDifference(q.servedAt || q.calledAt, q.completedAt)
            );
            avgServiceTime = Math.round(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length);
        }

        return {
            total: queues.length,
            completed: completed.length,
            noShow: noShow.length,
            avgServiceTime,
            efficiency: queues.length > 0 ? Math.round((completed.length / queues.length) * 100) : 0
        };
    },

    /**
     * Export queue data
     */
    exportQueues(branchId = null, startDate = null, endDate = null) {
        let queues = Database.getQueues({ branchId });

        // Filter by date range
        if (startDate) {
            queues = queues.filter(q => new Date(q.createdAt) >= new Date(startDate));
        }
        if (endDate) {
            queues = queues.filter(q => new Date(q.createdAt) <= new Date(endDate));
        }

        // Enrich with related data
        const enrichedQueues = queues.map(queue => {
            const branch = Database.getBranch(queue.branchId);
            const service = Database.getService(queue.serviceId);
            const staff = queue.staffId ? Database.getStaffMember(queue.staffId) : null;

            return {
                'Queue Number': queue.queueNumber,
                'Branch': branch?.name,
                'Service': service?.name,
                'Staff': staff?.name || 'N/A',
                'Status': queue.status,
                'Created': Utils.formatDate(queue.createdAt),
                'Called': queue.calledAt ? Utils.formatDate(queue.calledAt) : 'N/A',
                'Completed': queue.completedAt ? Utils.formatDate(queue.completedAt) : 'N/A',
                'Wait Time (min)': queue.calledAt ? Utils.getTimeDifference(queue.createdAt, queue.calledAt) : 'N/A',
                'Service Time (min)': queue.completedAt && queue.servedAt ? Utils.getTimeDifference(queue.servedAt, queue.completedAt) : 'N/A'
            };
        });

        // Convert to CSV
        if (enrichedQueues.length === 0) {
            return '';
        }

        const headers = Object.keys(enrichedQueues[0]);
        const csv = [
            headers.join(','),
            ...enrichedQueues.map(row =>
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                }).join(',')
            )
        ].join('\n');

        return csv;
    },

    /**
     * Print queue ticket
     */
    printTicket(queueId) {
        const queue = Database.getQueue(queueId);
        if (!queue) return;

        const branch = Database.getBranch(queue.branchId);
        const service = Database.getService(queue.serviceId);
        const org = Database.getOrganization(branch.organizationId);

        const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Queue Ticket - ${queue.queueNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10mm;
          }
          .header {
            text-align: center;
            margin-bottom: 5mm;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
          }
          .queue-number {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            margin: 10mm 0;
            border: 3px solid #000;
            padding: 10mm;
          }
          .info {
            margin: 5mm 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 2mm 0;
          }
          .qr-code {
            text-align: center;
            margin: 5mm 0;
          }
          .footer {
            text-align: center;
            margin-top: 5mm;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">OPERATOR AI</div>
          <div>${org.name}</div>
          <div>${branch.name}</div>
        </div>
        
        <div class="queue-number">
          ${queue.queueNumber}
        </div>
        
        <div class="info">
          <div class="info-row">
            <span>Service:</span>
            <span>${service.name}</span>
          </div>
          <div class="info-row">
            <span>Time:</span>
            <span>${Utils.formatDate(queue.createdAt, 'time')}</span>
          </div>
          <div class="info-row">
            <span>People ahead:</span>
            <span>${this.getWaitingCount(queue.branchId, queue.serviceId) - 1}</span>
          </div>
          <div class="info-row">
            <span>Est. wait:</span>
            <span>${queue.estimatedWaitTime} min</span>
          </div>
        </div>
        
        <div class="qr-code">
          <img src="${Utils.generateQRCode(queue.id)}" alt="QR Code" width="150">
        </div>
        
        <div class="footer">
          Powered by Operator AI<br>
          ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

        const printWindow = window.open('', '', 'width=300,height=600');
        printWindow.document.write(ticketHTML);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
};

// Initialize on load
QueueManager.init();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueueManager;
}
