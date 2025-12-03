// Operator AI - Admin Dashboard
// Handles dashboard logic, statistics, and management

const AdminDashboard = {
    // Current active tab
    activeTab: 'overview',

    /**
     * Initialize dashboard
     */
    init() {
        // Check Authentication
        if (!this.checkAuth()) {
            return;
        }

        this.setupNavigation();
        this.setupTheme();
        this.setupLanguage();
        this.loadContent();

        // Refresh data every 30 seconds
        setInterval(() => this.refreshData(), 30000);
    },

    /**
     * Check if user is authenticated
     */
    checkAuth() {
        const isAuth = sessionStorage.getItem('admin_auth') === 'true';
        if (!isAuth) {
            window.location.href = 'admin-login.html';
            return false;
        }
        return true;
    },

    /**
     * Logout
     */
    logout() {
        sessionStorage.removeItem('admin_auth');
        window.location.href = 'admin-login.html';
    },

    /**
     * Setup sidebar navigation
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = item.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Tizimdan chiqmoqchimisiz?')) {
                    this.logout();
                }
            });
        }
    },

    /**
     * Switch active tab
     */
    switchTab(tabId) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });

        // Update page title
        const titleKey = tabId; // Assuming keys match tab IDs
        const titleElement = document.getElementById('page-title');
        // Simple mapping or use i18n if available for titles
        const titles = {
            overview: { uz: 'Umumiy ko\'rinish', ru: 'Обзор', en: 'Overview' },
            analytics: { uz: 'Tahlillar', ru: 'Аналитика', en: 'Analytics' },
            organizations: { uz: 'Tashkilotlar', ru: 'Организации', en: 'Organizations' },
            staff: { uz: 'Xodimlar', ru: 'Сотрудники', en: 'Staff' },
            settings: { uz: 'Sozlamalar', ru: 'Настройки', en: 'Settings' }
        };
        const lang = Language.getLanguage();
        titleElement.textContent = titles[tabId]?.[lang] || tabId;

        this.activeTab = tabId;
        this.loadContent();
    },

    /**
     * Load content for current tab
     */
    loadContent() {
        switch (this.activeTab) {
            case 'overview':
                this.loadStatistics();
                this.loadRecentActivity();
                break;
            case 'organizations':
                this.loadOrganizations();
                break;
            case 'staff':
                this.loadStaff();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    },

    /**
     * Load Analytics Tab
     */
    loadAnalytics() {
        const queues = Database.getQueues();
        const users = Database.getUsers();

        // 1. Calculate Summary Stats
        const totalBookings = queues.length;
        const newUsers = users.length;
        const completed = queues.filter(q => q.status === 'completed').length;
        const cancelled = queues.filter(q => q.status === 'cancelled').length;

        document.getElementById('analytics-total-bookings').textContent = totalBookings;
        document.getElementById('analytics-new-users').textContent = newUsers;
        document.getElementById('analytics-completed').textContent = completed;
        document.getElementById('analytics-cancelled').textContent = cancelled;

        // 2. Render Charts
        this.renderBookingsChart(queues);
        this.renderServicesChart(queues);
    },

    /**
     * Render Bookings Dynamics Chart (Last 7 days)
     */
    renderBookingsChart(queues) {
        const container = document.getElementById('bookings-chart');
        container.innerHTML = '';
        container.style.cssText = 'display: flex; align-items: flex-end; justify-content: space-between; height: 200px; padding-top: 20px;';

        // Get last 7 days
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }

        // Count bookings per day
        const counts = days.map(day => {
            return queues.filter(q => q.createdAt.startsWith(day)).length;
        });

        const maxCount = Math.max(...counts, 10); // Min scale 10

        days.forEach((day, index) => {
            const count = counts[index];
            const height = (count / maxCount) * 100;
            const dateLabel = new Date(day).toLocaleDateString('uz-UZ', { weekday: 'short' });

            const barContainer = document.createElement('div');
            barContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%;';

            barContainer.innerHTML = `
                <div style="margin-bottom: 5px; font-weight: bold; color: var(--primary);">${count}</div>
                <div style="width: 30px; height: ${height}%; background: var(--primary-gradient); border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
                <div style="margin-top: 5px; font-size: 0.8rem; color: var(--text-secondary);">${dateLabel}</div>
            `;
            container.appendChild(barContainer);
        });
    },

    /**
     * Render Services Distribution Chart
     */
    renderServicesChart(queues) {
        const container = document.getElementById('services-analytics-chart');
        container.innerHTML = '';

        // Count by service
        const serviceCounts = {};
        queues.forEach(q => {
            const service = Database.getService(q.serviceId);
            if (service) {
                serviceCounts[service.name] = (serviceCounts[service.name] || 0) + 1;
            }
        });

        const total = queues.length || 1;
        const sortedServices = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5

        sortedServices.forEach(([name, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);

            const item = document.createElement('div');
            item.style.cssText = 'margin-bottom: 15px;';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem;">
                    <span>${name}</span>
                    <strong>${percentage}% (${count})</strong>
                </div>
                <div style="width: 100%; height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: var(--primary-gradient);"></div>
                </div>
            `;
            container.appendChild(item);
        });
    },

    /**
     * Load Settings Tab (User Management)
     */
    loadSettings() {
        const users = Database.getUsers();
        const tbody = document.getElementById('users-list');
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Foydalanuvchilar topilmadi</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            const regDate = new Date(user.createdAt).toLocaleDateString('uz-UZ');
            const lastLogin = new Date(user.lastLogin).toLocaleString('uz-UZ');
            const contact = user.telegramId ? `TG: ${user.telegramId}` : user.phone;

            tr.innerHTML = `
                <td>#${user.id.slice(-4)}</td>
                <td>${contact}</td>
                <td>${regDate}</td>
                <td>${lastLogin}</td>
                <td>
                    <button class="btn-icon delete-user-btn" data-id="${user.id}" style="color: var(--error); background: none; border: none; cursor: pointer;">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add delete handlers
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                this.deleteUser(userId);
            });
        });
    },

    /**
     * Delete User
     */
    deleteUser(userId) {
        if (confirm('Haqiqatan ham bu foydalanuvchini o\'chirmoqchimisiz?')) {
            Database.deleteUser(userId);
            this.loadSettings(); // Reload list
            Utils.showToast('Foydalanuvchi o\'chirildi', 'success');
        }
    },
    loadStatistics() {
        const stats = Database.getStatistics();

        // Update stats cards
        document.getElementById('total-visitors').textContent = stats.total;
        document.getElementById('avg-wait-time').textContent = `${stats.avgWaitTime} min`;
        document.getElementById('completed-services').textContent = stats.completed;

        // Calculate satisfaction (mock logic for now)
        const satisfaction = 4.5 + (Math.random() * 0.5);
        document.getElementById('satisfaction-rate').textContent = satisfaction.toFixed(1);
    },

    /**
     * Load recent activity
     */
    loadRecentActivity() {
        const queues = Database.getQueues();
        // Get last 5 activities
        const recentQueues = queues
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const container = document.getElementById('activity-list');
        container.innerHTML = '';

        recentQueues.forEach(queue => {
            const branch = Database.getBranch(queue.branchId);
            const service = Database.getService(queue.serviceId);
            const time = new Date(queue.createdAt).toLocaleTimeString();

            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">🎫</div>
                <div class="activity-details">
                    <div class="activity-text">
                        <strong>${queue.queueNumber}</strong> - ${service.name} (${branch.name})
                    </div>
                    <div class="activity-time">${time}</div>
                </div>
                <div class="activity-status status-${queue.status}">${queue.status}</div>
            `;
            container.appendChild(item);
        });
    },

    /**
     * Load organizations list
     */
    loadOrganizations() {
        const orgs = Database.getOrganizations();
        const container = document.getElementById('org-grid');
        container.innerHTML = '';

        orgs.forEach(org => {
            const branches = Database.getBranches(org.id);
            const card = document.createElement('div');
            card.className = 'org-card';
            // Add basic styles inline or in CSS
            card.style.cssText = 'background: white; padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow-sm);';

            card.innerHTML = `
                <div class="org-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div class="org-logo" style="font-size: 2rem;">${org.logo}</div>
                    <div>
                        <h3 style="margin: 0;">${org.name}</h3>
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">${org.type.toUpperCase()}</span>
                    </div>
                </div>
                <div class="org-stats" style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.9rem;">
                    <span>Branches: ${branches.length}</span>
                    <span>Status: Active</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * Load staff list
     */
    loadStaff() {
        const staffList = Database.getStaff();
        const container = document.getElementById('staff-list');
        container.innerHTML = '';

        // Group by organization/branch for better display? 
        // For now just a flat list or grouped by branch

        staffList.forEach(staff => {
            const branch = Database.getBranch(staff.branchId);
            const item = document.createElement('div');
            item.className = 'staff-item';
            item.style.cssText = 'background: white; padding: 1rem; border-radius: 12px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm);';

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; background: var(--primary-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                        ${staff.name.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 600;">${staff.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${branch.name} • ${staff.counter}</div>
                    </div>
                </div>
                <div class="status-badge ${staff.isActive ? 'active' : 'inactive'}" style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; background: ${staff.isActive ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)'}; color: ${staff.isActive ? 'var(--success-color)' : 'var(--error-color)'};">
                    ${staff.isActive ? 'Active' : 'Inactive'}
                </div>
            `;
            container.appendChild(item);
        });
    },

    /**
     * Refresh data
     */
    refreshData() {
        if (this.activeTab === 'overview') {
            this.loadStatistics();
            this.loadRecentActivity();
        }
    },

    /**
     * Setup theme toggle
     */
    setupTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            themeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });

        // Load saved theme
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.querySelector('.icon').textContent = '☀️';
        }
    },

    /**
     * Setup language switcher
     */
    setupLanguage() {
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                Language.setLanguage(lang);
                this.updateLanguageUI(lang);
            });
        });

        // Set initial active button
        const currentLang = Language.getLanguage();
        this.updateLanguageUI(currentLang);
    },

    /**
     * Update UI for selected language
     */
    updateLanguageUI(lang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Reload content to apply translations
        this.switchTab(this.activeTab);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    AdminDashboard.init();
});
