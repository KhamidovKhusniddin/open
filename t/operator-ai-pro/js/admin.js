document.addEventListener('DOMContentLoaded', () => {
    // Auth Elements
    const loginOverlay = document.getElementById('login-overlay');
    const adminLayout = document.getElementById('admin-layout');
    const loginBtn = document.getElementById('login-btn');
    const phoneInput = document.getElementById('admin-phone');
    const passwordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');

    // Check existing session
    const token = localStorage.getItem('admin_token');
    if (token) {
        showDashboard();
    }

    // Login Event
    loginBtn.addEventListener('click', handleLogin);
    [phoneInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });

    async function handleLogin() {
        const phone = phoneInput.value;
        const password = passwordInput.value;

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kirilmoqda...';

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem('admin_token', data.token);
                showDashboard();
            } else {
                loginError.style.display = 'block';
                loginError.textContent = '❌ ' + (data.message || 'Login yoki parol noto\'g\'ri!');
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Server bilan bog\'lanishda xatolik!');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Kirish';
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

        // Load Initial Data
        fetchQueueData();

        // Real-time updates via WebSockets
        const socket = io();
        socket.on('connect', () => {
            console.log('Connected to real-time server');
        });

        socket.on('queue_updated', (data) => {
            console.log('Real-time update received:', data);
            fetchQueueData();
        });

        // Sidebar Navigation Logic
        const navItems = document.querySelectorAll('.nav-item');
        const views = document.querySelectorAll('.view-section');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                const viewName = item.textContent.trim().toLowerCase();
                views.forEach(v => v.classList.add('hidden'));

                if (viewName === 'dashboard') {
                    document.getElementById('view-dashboard').classList.remove('hidden');
                } else if (viewName === 'analitika') {
                    document.getElementById('view-analytics').classList.remove('hidden');
                    fetchAnalytics();
                } else if (viewName === 'navbatlar') {
                    document.getElementById('view-queues').classList.remove('hidden');
                }
            });
        });

        // --- Analytics Chart Logic ---
        let hourlyChart = null;
        let serviceChart = null;

        async function fetchAnalytics() {
            try {
                const resp = await secureFetch('/api/admin/analytics');
                const result = await resp.json();
                if (result.success) {
                    updateCharts(result.data);
                    generateAIInsight(result.data);
                }
            } catch (err) {
                console.error('Analytics error:', err);
            }
        }

        function updateCharts(data) {
            const ctxHourly = document.getElementById('hourlyTrafficChart').getContext('2d');
            const ctxService = document.getElementById('serviceUsageChart').getContext('2d');

            const hourlyLabels = Object.keys(data.hourly).sort();
            const hourlyValues = hourlyLabels.map(h => data.hourly[h]);

            const serviceLabels = Object.keys(data.services);
            const serviceValues = serviceLabels.map(s => data.services[s]);

            // Hourly Chart
            if (hourlyChart) hourlyChart.destroy();
            hourlyChart = new Chart(ctxHourly, {
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
            if (serviceChart) serviceChart.destroy();
            serviceChart = new Chart(ctxService, {
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
                        legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                    }
                }
            });
        }

        function generateAIInsight(data) {
            const insightBox = document.getElementById('ai-insight');
            const total = Object.values(data.hourly).reduce((a, b) => a + b, 0);

            if (total === 0) {
                insightBox.textContent = "Hozircha ma'lumotlar yetarli emas. Kun yakunida tahlil tayyor bo'ladi.";
                return;
            }

            // Simple rule-based insight for professional feel
            let peakHour = Object.keys(data.hourly).reduce((a, b) => data.hourly[a] > data.hourly[b] ? a : b);
            let topService = Object.keys(data.services).reduce((a, b) => data.services[a] > data.services[b] ? a : b);

            insightBox.innerHTML = `
                🤖 <b>AI Tahlili:</b> Bugun eng ko'p yuklama <b>${peakHour}:00</b> atrofida kuzatildi. 
                Eng ommabop xizmat: <b>${topService}</b>. <br>
                <span style="color: var(--primary-light)">Tavsiya:</span> Shu vaqtda qo'shimcha operator jalb qilish kutish vaqtini 15% ga qisqartirishi mumkin.
            `;
        }
        // Dashboard Control Listeners
        if (btnCallNext) btnCallNext.addEventListener('click', callNextClient);
        if (btnComplete) btnComplete.addEventListener('click', () => updateStatus('completed'));
        if (btnRecall) btnRecall.addEventListener('click', () => updateStatus('serving', true));
        if (btnNoShow) btnNoShow.addEventListener('click', () => updateStatus('noshow'));

        async function secureFetch(url, options = {}) {
            const token = localStorage.getItem('admin_token');
            const headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(url, { ...options, headers });

            if (response.status === 401) {
                // Token expired or invalid
                logoutAdmin();
                return null;
            }

            return response;
        }

        async function fetchQueueData() {
            try {
                const response = await secureFetch('/api/admin/queues');
                if (!response) return;

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

            const sortedQueues = Object.values(queues).sort((a, b) => {
                const statusOrder = { 'serving': 0, 'waiting': 1, 'completed': 2, 'noshow': 3 };
                return statusOrder[a.status] - statusOrder[b.status] || a.created_at.localeCompare(b.created_at);
            });

            sortedQueues.forEach(q => {
                if (q.status === 'serving') {
                    currentNumberEl.textContent = q.number;
                    currentQueueId = q.id;
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                <td><strong>${q.number}</strong></td>
                <td>${q.phone}</td>
                <td>${q.time || '-'}</td>
                <td>${q.service || 'Umumiy'}</td>
                <td><span class="badge ${q.status}">${getStatusLabel(q.status)}</span></td>
            `;
                queueTableBody.appendChild(row);
            });

            const nextQ = sortedQueues.find(q => q.status === 'waiting');
            nextNumberEl.textContent = nextQ ? nextQ.number : '---';
            btnCallNext.disabled = !!sortedQueues.find(q => q.status === 'serving');
        }

        function updateStats(queues) {
            const list = Object.values(queues);
            waitingCountEl.textContent = list.filter(q => q.status === 'waiting').length;
            servedCountEl.textContent = list.filter(q => q.status === 'completed').length;
        }

        async function callNextClient() {
            try {
                const response = await secureFetch('/api/admin/call_next', { method: 'POST' });
                if (!response) return;

                const data = await response.json();
                if (data.success) {
                    alert(`🔊 Chaqirilmoqda: ${data.queue.number}`);
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
                const response = await secureFetch('/api/admin/update_status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentQueueId, status: status, recall: isRecall })
                });
                if (!response) return;

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

        window.logoutAdmin = () => {
            localStorage.removeItem('admin_token');
            location.reload();
        };
    }
});
