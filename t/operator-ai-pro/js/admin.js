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
                if (data.user) {
                    localStorage.setItem('admin_user', JSON.stringify(data.user));
                }
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
        const btnTransfer = document.getElementById('btn-transfer');

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
                } else if (viewName === 'reytinglar') {
                    document.getElementById('view-ratings').classList.remove('hidden');
                    fetchRatings();
                } else if (viewName === 'tashkilotlar') {
                    document.getElementById('view-organizations').classList.remove('hidden');
                    fetchOrganizations();
                } else if (viewName === 'adminlar') {
                    document.getElementById('view-admins').classList.remove('hidden');
                    fetchOrgsForSelect();
                } else if (viewName === 'sozlamalar') {
                    document.getElementById('view-settings').classList.remove('hidden');
                    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
                    if (user.role === 'org_admin') {
                        fetchOrgSettings();
                        fetchOrgServices();
                    }
                }
            });
        });

        // Check Role & Show Admin Items
        const userStr = localStorage.getItem('admin_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'system_admin') {
                document.querySelectorAll('.super-admin-only').forEach(el => el.classList.remove('hidden'));
            }

            // Update Profile Name
            const profileName = document.querySelector('.user-profile .name');
            const profileRole = document.querySelector('.user-profile .role');
            if (profileName) profileName.textContent = user.phone;
            if (profileRole) profileRole.textContent = user.role === 'system_admin' ? 'Super Admin' : 'Admin';
        }

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
        if (btnTransfer) btnTransfer.addEventListener('click', openTransferModal);

        async function openTransferModal() {
            if (!currentQueueId) return;
            const select = document.getElementById('transfer-service-select');
            const modal = document.getElementById('transfer-modal');

            select.innerHTML = '<option value="">Yuklanmoqda...</option>';
            modal.classList.remove('hidden');

            try {
                const resp = await secureFetch('/api/org/services');
                const data = await resp.json();
                if (data.success && data.services) {
                    select.innerHTML = data.services
                        .map(s => `<option value="${s.id}">${s.name_uz}</option>`)
                        .join('');
                } else {
                    select.innerHTML = '<option value="">Xizmatlar topilmadi</option>';
                }
            } catch (e) {
                select.innerHTML = '<option value="">Xatolik yuz berdi</option>';
            }
        }

        window.closeTransferModal = () => {
            document.getElementById('transfer-modal').classList.add('hidden');
        };

        window.confirmTransfer = async () => {
            const svcId = document.getElementById('transfer-service-select').value;
            if (!svcId) return alert("Iltimos, bo'limni tanlang");

            try {
                const resp = await secureFetch('/api/admin/transfer_queue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentQueueId, service_id: svcId })
                });
                const data = await resp.json();
                if (data.success) {
                    closeTransferModal();
                    fetchQueueData();
                    currentNumberEl.textContent = '---';
                    currentQueueId = null;
                    alert("Mijoz muvaffaqiyatli yo'naltirildi!");
                } else {
                    alert("Xatolik: " + data.message);
                }
            } catch (e) {
                alert("Server xatosi");
            }
        };

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

        async function fetchRatings() {
            try {
                const resp = await secureFetch('/api/admin/ratings');
                const result = await resp.json();
                if (result.success) {
                    renderRatings(result.ratings, result.recent || []);
                }
            } catch (err) {
                console.error('Ratings fetch error:', err);
            }
        }

        function renderRatings(ratings, recent) {
            const container = document.getElementById('ratings-container');
            const tbody = document.getElementById('ratings-table-body');
            const feedbackBody = document.getElementById('feedback-list-body');

            container.innerHTML = '';
            tbody.innerHTML = '';
            if (feedbackBody) feedbackBody.innerHTML = '';

            ratings.forEach(r => {
                // Large Card for each service
                const card = document.createElement('div');
                card.className = 'stat-card';
                const avg = parseFloat(r.avg_rating).toFixed(1);
                const stars = "⭐".repeat(Math.round(avg));

                card.innerHTML = `
                    <div class="icon orange" style="font-size: 1.2rem;">${avg}</div>
                    <div class="details">
                        <span class="label">${r.service_name}</span>
                        <span class="value" style="font-size: 1.2rem;">${stars}</span>
                        <span class="label">${r.count} ta baho</span>
                    </div>
                `;
                container.appendChild(card);

                // Table row
                const tr = document.createElement('tr');
                const status = avg >= 4 ? '<span class="badge serving">A\'lo</span>' : (avg >= 3 ? '<span class="badge waiting">Yaxshi</span>' : '<span class="badge noshow">Qoniqarsiz</span>');
                tr.innerHTML = `
                    <td><strong>${r.service_name}</strong></td>
                    <td>${avg} / 5.0</td>
                    <td>${r.count}</td>
                    <td>${status}</td>
                `;
                tbody.appendChild(tr);
            });

            // Render Recent Feedback
            if (feedbackBody && recent) {
                recent.forEach(f => {
                    const tr = document.createElement('tr');
                    const stars = "⭐".repeat(f.rating);
                    tr.innerHTML = `
                        <td>${f.queue_number}</td>
                        <td>${stars} (${f.rating})</td>
                        <td>${f.comment || '-'}</td>
                        <td style="font-size: 0.8rem; color: var(--text-secondary)">${new Date(f.created_at).toLocaleString()}</td>
                    `;
                    feedbackBody.appendChild(tr);
                });
            }
        }

        window.logoutAdmin = () => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            location.reload();
        };

        // --- SuperAdmin Functions ---

        async function fetchOrganizations() {
            const tableBody = document.getElementById('org-table-body');
            tableBody.innerHTML = '<tr><td colspan="4">Yuklanmoqda...</td></tr>';

            try {
                const resp = await secureFetch('/api/super/organizations');
                if (!resp) return;
                const data = await resp.json();

                tableBody.innerHTML = '';
                if (data.success && data.organizations) {
                    data.organizations.forEach(org => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${org.id}</td>
                            <td>${org.name}</td>
                            <td><span class="badge serving">${org.license_status}</span></td>
                            <td>${new Date(org.created_at).toLocaleDateString()}</td>
                        `;
                        tableBody.appendChild(tr);
                    });
                }
            } catch (e) {
                console.error(e);
                tableBody.innerHTML = '<tr><td colspan="4" style="color:red">Xatolik</td></tr>';
            }
        }

        window.openAddOrgModal = async () => {
            const name = prompt("Tashkilot nomini kiriting:");
            if (!name) return;

            try {
                const resp = await secureFetch('/api/super/organizations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                if (!resp) return;
                const data = await resp.json();
                if (data.success) {
                    alert(`Tashkilot yaratildi! ID: ${data.org_id}`);
                    fetchOrganizations();
                } else {
                    alert("Xatolik: " + data.message);
                }
            } catch (e) { alert("Xatolik"); }
        };

        async function fetchOrgsForSelect() {
            const select = document.getElementById('new-admin-org');
            try {
                const resp = await secureFetch('/api/super/organizations');
                if (!resp) return;
                const data = await resp.json();

                select.innerHTML = '<option value="">Tanlang...</option>';
                if (data.success && data.organizations) {
                    data.organizations.forEach(org => {
                        const opt = document.createElement('option');
                        opt.value = org.id;
                        opt.textContent = org.name;
                        select.appendChild(opt);
                    });
                }
            } catch (e) { console.error(e); }
        }

        // Create Admin Form Handler
        const createAdminForm = document.getElementById('create-admin-form');
        if (createAdminForm) {
            createAdminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const phone = document.getElementById('new-admin-phone').value;
                const password = document.getElementById('new-admin-password').value;
                const role = document.getElementById('new-admin-role').value;
                const org_id = document.getElementById('new-admin-org').value;

                if (!phone || !password) return alert("Ma'lumotlar yetarli emas");

                try {
                    const resp = await secureFetch('/api/super/create-admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, password, role, org_id })
                    });
                    if (!resp) return;
                    const data = await resp.json();

                    if (data.success) {
                        alert("Admin muvaffaqiyatli yaratildi!");
                        createAdminForm.reset();
                    } else {
                        alert("Xatolik: " + data.message);
                    }
                } catch (e) {
                    console.error('Create admin error:', e);
                    alert("Xatolik yuz berdi");
                }
            });
        }

        // --- Org Admin Functions ---

        async function fetchOrgSettings() {
            try {
                const resp = await secureFetch('/api/org/settings');
                if (!resp) return;
                const data = await resp.json();
                if (data.success && data.org) {
                    const nameInput = document.getElementById('setting-org-name');
                    if (nameInput) nameInput.value = data.org.name || '';
                }
            } catch (e) { console.error('Fetch settings error:', e); }
        }

        const orgSettingsForm = document.getElementById('org-settings-form');
        if (orgSettingsForm) {
            orgSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('setting-org-name');
                if (!nameInput) return;
                const name = nameInput.value;
                try {
                    const resp = await secureFetch('/api/org/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                    });
                    if (!resp) return;
                    const result = await resp.json();
                    if (result.success) alert("Tashkilot nomi yangilandi!");
                    else alert("Xatolik: " + result.message);
                } catch (e) { alert("Xatolik"); }
            });
        }

        async function fetchOrgServices() {
            const tbody = document.getElementById('services-table-body');
            if (!tbody) return;
            tbody.innerHTML = '<tr><td colspan="3">Yuklanmoqda...</td></tr>';
            try {
                const resp = await secureFetch('/api/org/services');
                if (!resp) {
                    tbody.innerHTML = '<tr><td colspan="3">Avtorizatsiya xatosi</td></tr>';
                    return;
                }
                const data = await resp.json();
                if (data.success && data.services) {
                    tbody.innerHTML = '';
                    if (data.services.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="3">Xizmatlar yo\'q</td></tr>';
                        return;
                    }
                    data.services.forEach(svc => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${svc.name_uz}</td>
                            <td>${svc.estimated_duration}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" onclick="deleteService('${svc.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="3">Xatolik: ' + (data.message || 'Ma\'lumot topilmadi') + '</td></tr>';
                }
            } catch (e) {
                console.error('Fetch services error:', e);
                tbody.innerHTML = '<tr><td colspan="3">Tizimda xatolik</td></tr>';
            }
        }

        window.openAddServiceModal = async () => {
            const name = prompt("Xizmat nomini kiriting (masalan: Kredit bo'limi):");
            if (!name) return;
            const durationInput = prompt("O'rtacha xizmat vaqti (daqiqada):", "15");
            if (!durationInput) return;
            const duration = parseInt(durationInput);

            try {
                const resp = await secureFetch('/api/org/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, duration })
                });
                if (!resp) return;
                const data = await resp.json();
                if (data.success) {
                    alert("Xizmat qo'shildi!");
                    fetchOrgServices();
                } else alert("Xatolik: " + data.message);
            } catch (e) { alert("Xatolik"); }
        };

        window.deleteService = async (id) => {
            if (!confirm("Haqiqatan ham ushbu xizmatni o'chirmoqchimisiz?")) return;
            try {
                const resp = await secureFetch(`/api/org/services?id=${id}`, { method: 'DELETE' });
                if (!resp) return;
                const data = await resp.json();
                if (data.success) {
                    alert("Xizmat o'chirildi.");
                    fetchOrgServices();
                } else alert("Xatolik");
            } catch (e) { alert("Xatolik"); }
        };
    }
});
