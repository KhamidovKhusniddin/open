// Operator AI - Live Tracker Logic
const Tracker = {
    queueId: null,
    updateInterval: null,

    init() {
        // Get queueId from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.queueId = urlParams.get('id');

        if (!this.queueId) {
            window.location.href = 'index.html';
            return;
        }

        this.updateUI();
        this.startAutoUpdate();
        this.initEventListeners();
    },

    initEventListeners() {
        const btnNotify = document.getElementById('btn-notify');
        if (btnNotify) {
            btnNotify.addEventListener('click', () => {
                const email = document.getElementById('notify-email').value;
                if (Utils.validateEmail(email)) {
                    Utils.showToast(Language.t('success_saved'), 'success');
                } else {
                    Utils.showToast(Language.t('error_invalid_email'), 'error');
                }
            });
        }
    },

    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateUI();
        }, 5000); // Update every 5 seconds
    },

    updateUI() {
        const queue = Database.getQueue(this.queueId);
        if (!queue) return;

        // Update elements
        document.getElementById('queue-number').textContent = queue.queueNumber;

        // Calculate progress
        const posData = this.getQueuePosition(this.queueId);
        if (posData) {
            const peopleAhead = posData.position - 1;
            document.getElementById('people-ahead').textContent = peopleAhead;

            // Progress percentage logic: 
            // If pos 1, progress 95%
            // If pos > 10, progress 10%
            let progress = 100 - (posData.position * 10);
            if (progress < 10) progress = 10;
            if (posData.position === 1) progress = 95;
            if (queue.status === 'called' || queue.status === 'serving') progress = 100;

            document.getElementById('tracker-progress').style.width = `${progress}%`;
            document.getElementById('progress-percent').textContent = `${progress}%`;

            // Wait time
            document.getElementById('wait-time').textContent = `${posData.estimatedWaitTime} ${Language.t('minutes')}`;

            // Expected time
            const expectedTime = new Date(new Date().getTime() + posData.estimatedWaitTime * 60000);
            document.getElementById('expected-time').textContent = Utils.formatDate(expectedTime, 'time');
        }

        // Last updated time
        document.getElementById('last-update').textContent = `${Language.t('last_updated_at')}: ${Utils.formatDate(new Date(), 'time')}`;

        // Status specific messages
        const msgPane = document.getElementById('admin-message');
        if (queue.status === 'called') {
            msgPane.innerHTML = `<strong>${Language.t('your_turn_has_come')}!</strong><br>${Language.t('proceed_to_counter')}`;
            msgPane.classList.add('highlight');
            this.showPushNotification();
        } else if (queue.status === 'serving') {
            msgPane.textContent = Language.t('status_serving');
        } else if (queue.status === 'completed') {
            msgPane.textContent = Language.t('status_completed');
            clearInterval(this.updateInterval);
        }
    },

    getQueuePosition(queueId) {
        const queue = Database.getQueue(queueId);
        if (!queue) return null;

        const queues = Database.getQueues({
            branchId: queue.branchId,
            serviceId: queue.serviceId,
            status: 'waiting'
        });

        // Sort identical to QueueManager
        queues.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        const position = queues.findIndex(q => q.id === queueId) + 1;
        const service = Database.getService(queue.serviceId);
        const duration = service ? service.estimatedDuration : 15;

        return {
            position: position > 0 ? position : 1,
            estimatedWaitTime: (position > 0 ? position : 1) * duration
        };
    },

    showPushNotification() {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(Language.t('your_turn_has_come'), {
                body: `${Language.t('queue_number')}: ${document.getElementById('queue-number').textContent}`,
                icon: '🤖'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
};

// Start tracker
document.addEventListener('DOMContentLoaded', () => Tracker.init());
