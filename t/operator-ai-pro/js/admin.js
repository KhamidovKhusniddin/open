document.addEventListener('DOMContentLoaded', () => {
    // Auth Elements
    const loginOverlay = document.getElementById('login-overlay');
    const adminLayout = document.getElementById('admin-layout');
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');

    // Check existing session
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        showDashboard();
    }

    // Login Event
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    async function handleLogin() {
        const password = passwordInput.value;
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('admin_logged_in', 'true');
                showDashboard();
            } else {
                loginError.style.display = 'block';
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Server bilan bog\'lanishda xatolik!');
        }
    }

    function showDashboard() {
        loginOverlay.style.display = 'none';
        adminLayout.style.display = 'flex';
        initDashboard();
    }

    function initDashboard() {
        // Elements
        const queueTableBody = document.getElementById('queue-table-body');
        const waitingCountEl = document.getElementById('stat-waiting');
        const servedCountEl = document.getElementById('stat-served');
        const currentNumberEl = document.getElementById('current-number');
        const nextNumberEl = document.getElementById('next-number');

        // Buttons
        const btnCallNext = document.getElementById('btn-call-next');
        const btnComplete = document.getElementById('btn-complete');
        const btnRecall = document.getElementById('btn-recall');
        const btnNoShow = document.getElementById('btn-noshow');

        let currentQueueId = null;

        // Load Data
        fetchQueueData();

        // Poll for updates every 5 seconds
        const pollInterval = setInterval(fetchQueueData, 5000);

        // Sidebar Navigation Logic
        const navItems = document.querySelectorAll('.nav-item');
        const views = document.querySelectorAll('.view-section');

        navItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                views.forEach(v => v.classList.add('hidden'));
                const targetViewId = ['view-dashboard', 'view-queues', 'view-history', 'view-settings'][index];
                const targetView = document.getElementById(targetViewId);
                if (targetView) targetView.classList.remove('hidden');
            });
        });

        // Dashboard Control Listeners
        if (btnCallNext) btnCallNext.addEventListener('click', callNextClient);
        if (btnComplete) btnComplete.addEventListener('click', () => updateStatus('completed'));
        if (btnRecall) btnRecall.addEventListener('click', () => updateStatus('serving', true));
        if (btnNoShow) btnNoShow.addEventListener('click', () => updateStatus('noshow'));

        async function fetchQueueData() {
            try {
                const response = await fetch('/api/admin/queues');
                const data = await response.json();

                if (data.success) {
                    renderTable(data.queues);
                    updateStats(data.queues);
                }
            } catch (error) {
                console.error('Error fetching queues:', error);
            }
        }

        function renderTable(queues) {
            queueTableBody.innerHTML = '';

            // Sort: Waiting first, then serving, then others. Within waiting, by ID/Time.
            const sortedQueues = Object.values(queues).sort((a, b) => {
                const statusOrder = { 'serving': 0, 'waiting': 1, 'completed': 2, 'noshow': 3 };
                return statusOrder[a.status] - statusOrder[b.status] || a.id.localeCompare(b.id);
            });

            sortedQueues.forEach(q => {
                // Check if currently serving
                if (q.status === 'serving') {
                    currentNumberEl.textContent = q.number;
                    currentQueueId = q.id;
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                <td><strong>${q.number}</strong></td>
                <td>${q.phone}</td>
                <td>${q.time || '-'}</td>
                <td>${q.service || 'General'}</td>
                <td><span class="badge ${q.status}">${getStatusLabel(q.status)}</span></td>
            `;
                queueTableBody.appendChild(row);
            });

            // Update Next Number display
            const nextQ = sortedQueues.find(q => q.status === 'waiting');
            nextNumberEl.textContent = nextQ ? nextQ.number : '---';

            // Disable "Call Next" if already serving someone
            btnCallNext.disabled = !!sortedQueues.find(q => q.status === 'serving');
        }

        function updateStats(queues) {
            const list = Object.values(queues);
            waitingCountEl.textContent = list.filter(q => q.status === 'waiting').length;
            servedCountEl.textContent = list.filter(q => q.status === 'completed').length;
        }

        async function callNextClient() {
            try {
                const response = await fetch('/api/admin/call_next', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    // Sound effect here
                    alert(`Chaqirilmoqda: ${data.queue.number}`); // Temporary feedback
                    fetchQueueData();
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Call next error:', error);
            }
        }

        async function updateStatus(status, isRecall = false) {
            if (!currentQueueId) return;

            try {
                const response = await fetch('/api/admin/update_status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentQueueId, status: status, recall: isRecall })
                });
                const data = await response.json();
                if (data.success) {
                    fetchQueueData();
                    if (status !== 'serving') {
                        currentNumberEl.textContent = '---';
                        currentQueueId = null;
                    }
                }
            } catch (error) {
                console.error('Update status error:', error);
            }
        }

        function getStatusLabel(status) {
            const labels = {
                'waiting': 'Kutmoqda',
                'serving': 'Xizmatda',
                'completed': 'Tugatildi',
                'noshow': 'Kelmadi'
            };
            return labels[status] || status;
        }

        // Logout logic
        window.logoutAdmin = () => {
            sessionStorage.removeItem('admin_logged_in');
            location.reload();
        };
    }
});
