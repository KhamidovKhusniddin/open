// Operator AI - Live Tracker Logic
const Tracker = {
    queueId: null,
    updateInterval: null,

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.queueId = urlParams.get('id');

        if (!this.queueId) {
            window.location.href = 'index.html';
            return;
        }

        // Initial update
        await this.updateUI();

        // WebSocket setup for real-time updates
        const socket = io();
        socket.on('connect', () => console.log('Tracker connected to real-time server'));
        socket.on('queue_updated', async (data) => {
            console.log('Update received:', data);
            await this.updateUI();
        });

        this.initEventListeners();
    },

    initEventListeners() {
        const btnNotify = document.getElementById('btn-notify');
        if (btnNotify) {
            btnNotify.addEventListener('click', () => {
                const email = document.getElementById('notify-email').value;
                if (email && email.includes('@')) {
                    alert(Language.t('success_saved'));
                }
            });
        }
    },

    async updateUI() {
        try {
            // Fetch Queue Data
            const qResp = await fetch(`/api/queue/${this.queueId}`);
            const qData = await qResp.json();
            if (!qData.success) return;
            const queue = qData.queue;

            // Update Basic Info
            document.getElementById('queue-number').textContent = queue.number;

            // Fetch Position Data
            const pResp = await fetch(`/api/queue-position/${this.queueId}`);
            const pData = await pResp.json();

            if (pData.success) {
                const pos = pData.data;
                document.getElementById('people-ahead').textContent = pos.people_ahead;

                // Progress calculation
                let progress = 100 - (pos.position * 10);
                if (progress < 10) progress = 10;
                if (pos.position === 1) progress = 95;
                if (pos.status === 'called' || pos.status === 'serving') progress = 100;

                document.getElementById('tracker-progress').style.width = `${progress}%`;
                document.getElementById('progress-percent').textContent = `${progress}%`;
                document.getElementById('wait-time').textContent = `${pos.estimated_wait} ${Language.t('minutes')}`;

                const expectedTime = new Date(new Date().getTime() + pos.estimated_wait * 60000);
                const timeStr = expectedTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                document.getElementById('expected-time').textContent = timeStr;
            }

            // Status message
            const msgPane = document.getElementById('admin-message');
            if (queue.status === 'called') {
                msgPane.innerHTML = `<strong>${Language.t('your_turn_has_come')}!</strong><br>${Language.t('proceed_to_counter')}`;
                msgPane.classList.add('highlight');
                this.showPushNotification();
            } else if (queue.status === 'serving') {
                msgPane.textContent = Language.t('status_serving');
            } else if (queue.status === 'completed') {
                msgPane.textContent = Language.t('status_completed');
            }

            document.getElementById('last-update').textContent =
                `${Language.t('last_updated_at')}: ${new Date().toLocaleTimeString('uz-UZ')}`;

        } catch (err) {
            console.error('Tracker update error:', err);
        }
    },

    showPushNotification() {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
            new Notification(Language.t('your_turn_has_come'), {
                body: `${Language.t('your_number')}: ${document.getElementById('queue-number').textContent}`,
                icon: '🤖'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Tracker.init());
