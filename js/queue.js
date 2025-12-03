// Queue Interface JavaScript

const QueueApp = {
    currentStep: 1,
    selectedOrg: null,
    selectedBranch: null,
    selectedService: null,
    selectedTime: null,
    currentQueue: null,

    init() {
        this.loadOrganizations();
        this.goToStep(1);
    },

    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active'));

        // Show selected step
        let stepId;
        if (step === 3.5) {
            stepId = 'step-datetime';
        } else if (step === 3.7) {
            stepId = 'step-auth';
        } else {
            stepId = `step-${step}`;
        }

        document.getElementById(stepId).classList.remove('hidden');

        // Update indicator (approximate for 3.5 and 3.7)
        const indicatorStep = Math.floor(step);
        document.querySelector(`.step-item[data-step="${indicatorStep}"]`)?.classList.add('active');

        this.currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    loadOrganizations() {
        const orgs = Database.getOrganizations();
        const grid = document.getElementById('organizations-grid');

        grid.innerHTML = orgs.map(org => {
            const orgType = CONFIG.organizationTypes.find(t => t.id === org.type);
            return `
        <div class="org-card" onclick="QueueApp.selectOrganization('${org.id}')">
          <span class="org-icon">${orgType?.icon || '🏢'}</span>
          <div class="org-name">${org.name}</div>
          <div class="org-desc">${orgType?.nameUz || org.type}</div>
        </div>
      `;
        }).join('');
    },

    selectOrganization(orgId) {
        this.selectedOrg = orgId;
        this.loadBranches(orgId);
        this.goToStep(2);
    },

    loadBranches(orgId) {
        const branches = Database.getBranches(orgId);
        const grid = document.getElementById('branches-grid');

        if (branches.length === 0) {
            grid.innerHTML = '<p class="text-center">Filiallar topilmadi</p>';
            return;
        }

        grid.innerHTML = branches.map(branch => `
      <div class="branch-card" onclick="QueueApp.selectBranch('${branch.id}')">
        <span class="branch-icon">🏢</span>
        <div class="branch-name">${branch.name}</div>
        <div class="branch-desc">${branch.address}</div>
        <div class="branch-info">
          <div class="info-item">
            <span>📞</span>
            <span>${branch.phone}</span>
          </div>
          <div class="info-item">
            <span>${branch.isActive ? '🟢' : '🔴'}</span>
            <span>${branch.isActive ? Language.t('status_active') || 'Faol' : Language.t('status_closed') || 'Yopiq'}</span>
          </div>
        </div>
      </div>
    `).join('');
    },

    selectBranch(branchId) {
        this.selectedBranch = branchId;
        this.loadServices(branchId);
        this.goToStep(3);
    },

    loadServices(branchId) {
        const services = Database.getServices(branchId);
        const grid = document.getElementById('services-grid');

        if (services.length === 0) {
            grid.innerHTML = '<p class="text-center">Xizmatlar topilmadi</p>';
            return;
        }

        grid.innerHTML = services.map(service => `
      <div class="service-card" onclick="QueueApp.selectService('${service.id}')">
        <span class="service-icon">📋</span>
        <div class="service-name">${service.name}</div>
        <div class="service-desc">${service.nameUz || service.name}</div>
        <div class="service-duration">
          <span>⏱</span>
          <span>~${service.estimatedDuration} ${Language.t('minutes') || 'daqiqa'}</span>
        </div>
      </div>
    `).join('');
    },

    selectService(serviceId) {
        this.selectedService = serviceId;
        this.loadTimeSlots();
        this.goToStep(3.5);
    },

    loadTimeSlots() {
        const dateInput = document.getElementById('booking-date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;

        dateInput.addEventListener('change', () => this.generateTimeSlots());
        this.generateTimeSlots();
    },

    generateTimeSlots() {
        const container = document.getElementById('time-slots');
        container.innerHTML = '';
        const slots = [];

        // Generate slots from 9:00 to 17:00
        for (let i = 9; i < 17; i++) {
            slots.push(`${i}:00`);
            slots.push(`${i}:30`);
        }

        slots.forEach(time => {
            const btn = document.createElement('button');
            btn.className = 'time-slot-btn';
            btn.textContent = time;
            btn.onclick = () => this.selectTimeSlot(time, btn);
            container.appendChild(btn);
        });

        // Disable confirm button initially
        document.getElementById('confirm-booking-btn').disabled = true;
    },

    selectTimeSlot(time, btn) {
        document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTime = time;
        document.getElementById('confirm-booking-btn').disabled = false;
    },

    confirmBooking() {
        // Check if user is authenticated
        if (!Auth.isAuthenticated()) {
            // Redirect to authentication step
            this.goToStep(3.7);
            return;
        }

        // User is authenticated, proceed to generate ticket
        this.generateTicket();
    },

    generateTicket() {
        if (!this.selectedBranch || !this.selectedService) {
            Utils.showToast('Branch or Service not selected', 'error');
            return;
        }

        Utils.showLoading(Language.t('loading'));

        setTimeout(() => {
            try {
                const queue = QueueManager.createQueue(
                    this.selectedBranch,
                    this.selectedService,
                    {
                        bookingDate: document.getElementById('booking-date').value,
                        bookingTime: this.selectedTime
                    }
                );

                if (queue) {
                    this.currentQueue = queue;
                    this.displayTicket(queue);
                    this.goToStep(4);
                } else {
                    // Try to get last error from Database if possible, or generic
                    Utils.showToast(Language.t('error_occurred') + ' (DB Error)', 'error');
                }
            } catch (error) {
                console.error('Error generating ticket:', error);
                Utils.showToast(`${Language.t('error_occurred')}: ${error.message}`, 'error');
            } finally {
                Utils.hideLoading();
            }
        }, 100);
    },

    reset() {
        this.currentStep = 1;
        this.selectedOrg = null;
        this.selectedBranch = null;
        this.selectedService = null;
        this.selectedTime = null;
        this.currentQueue = null;
        this.goToStep(1);
        this.loadOrganizations();
    },

    displayTicket(queue) {
        const org = Database.getOrganization(this.selectedOrg);
        const branch = Database.getBranch(queue.branchId);
        const service = Database.getService(queue.serviceId);
        const position = QueueManager.getQueuePosition(queue.id);

        // Update ticket info
        document.getElementById('ticket-org').textContent = org.name;
        document.getElementById('ticket-branch').textContent = branch.name;
        document.getElementById('ticket-number').textContent = queue.queueNumber;
        document.getElementById('ticket-service').textContent = service.name;

        if (queue.bookingTime) {
            document.getElementById('ticket-time').textContent = `${queue.bookingDate} ${queue.bookingTime}`;
        } else {
            document.getElementById('ticket-time').textContent = Utils.formatDate(queue.createdAt, 'time');
        }

        if (position) {
            document.getElementById('ticket-position').textContent = position.position;
            document.getElementById('ticket-wait').textContent = Utils.formatDuration(position.estimatedWaitTime);
        }

        // Generate QR code
        const qrCode = Utils.generateQRCode(queue.id);
        document.getElementById('ticket-qr-code').src = qrCode;

        // Start countdown timer for future bookings
        this.startCountdownTimer(queue);

        // Load currently serving
        this.loadCurrentlyServing();
    },

    /**
     * Start countdown timer for future queue bookings
     */
    startCountdownTimer(queue) {
        // Clear any existing timer
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // Only show countdown for future bookings
        if (!queue.bookingDate) return;

        const updateCountdown = () => {
            const now = new Date();
            const bookingDate = new Date(queue.bookingDate);

            // Set target time to 09:00 on booking date
            const targetTime = new Date(bookingDate);
            targetTime.setHours(9, 0, 0, 0);

            const diff = targetTime - now;

            // If time has passed, stop countdown
            if (diff <= 0) {
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                }
                const waitElement = document.getElementById('ticket-wait');
                if (waitElement) {
                    waitElement.textContent = 'Navbatingiz boshlandi!';
                }
                return;
            }

            // Calculate time remaining
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Update display
            const waitElement = document.getElementById('ticket-wait');
            if (waitElement) {
                waitElement.textContent = `${hours} soat ${minutes} daqiqa ${seconds} soniya`;
            }
        };

        // Update immediately
        updateCountdown();

        // Update every second
        this.countdownInterval = setInterval(updateCountdown, 1000);
    },


    startRealTimeUpdates() {
        // Subscribe to queue updates
        QueueManager.subscribe(() => {
            if (this.currentStep === 4 && this.currentQueue) {
                // Update queue position
                const position = QueueManager.getQueuePosition(this.currentQueue.id);
                if (position) {
                    document.getElementById('ticket-position').textContent = position.position;
                    document.getElementById('ticket-wait').textContent = Utils.formatDuration(position.estimatedWaitTime);
                }

                // Update currently serving
                this.loadCurrentlyServing();

                // Check if queue is called
                const queue = Database.getQueue(this.currentQueue.id);
                if (queue && queue.status === 'called') {
                    const staff = Database.getStaffMember(queue.staffId);
                    Utils.showNotification(
                        Language.t('your_turn_soon') || 'Sizning navbatingiz!',
                        {
                            body: `${Language.t('please_proceed_to') || 'Tashrif buyuring'}: ${staff?.counter || 'Counter'}`,
                            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎫</text></svg>'
                        }
                    );
                    Utils.playSound('call');
                }
            }
        });
    },

    loadCurrentlyServing() {
        const serving = QueueManager.getCurrentlyServing(this.selectedBranch);
        const list = document.getElementById('serving-list');

        if (serving.length === 0) {
            list.innerHTML = '<p class="text-center" style="color: var(--gray-600);">Hozircha xizmat ko\'rsatilmayapti</p>';
            return;
        }

        list.innerHTML = serving.map(queue => `
      <div class="serving-item">
        <div class="serving-number">${queue.queueNumber}</div>
        <div class="serving-counter">
          <span data-i18n="counter">Counter:</span>
          <strong>${queue.counter || 'N/A'}</strong>
        </div>
      </div>
    `).join('');
    },

    /**
     * Switch between registration and login tabs
     */
    switchAuthTab(tab) {
        const registerTab = document.getElementById('tab-register');
        const loginTab = document.getElementById('tab-login');
        const registerForm = document.getElementById('form-register');
        const loginForm = document.getElementById('form-login');

        if (tab === 'register') {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        } else {
            registerTab.classList.remove('active');
            loginTab.classList.add('active');
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }

        // Hide error messages
        document.getElementById('auth-error').classList.add('hidden');
    },

    /**
     * Handle Telegram login
     */
    handleTelegramLogin() {
        Utils.showLoading('Telegram orqali kirilmoqda...');

        // Simulate Telegram authentication
        setTimeout(() => {
            const result = Auth.loginWithTelegram();

            Utils.hideLoading();

            if (result.success) {
                Utils.showToast('Telegram orqali muvaffaqiyatli kirdingiz!', 'success');
                // Proceed to generate ticket
                this.generateTicket();
            } else {
                this.showAuthError(result.error);
            }
        }, 1000);
    },

    /**
     * Handle phone registration
     */
    handlePhoneRegister() {
        const phone = document.getElementById('register-phone').value.trim();

        if (!phone) {
            this.showAuthError('Telefon raqamni kiriting');
            return;
        }

        Utils.showLoading('Ro\'yxatdan o\'tilmoqda...');

        setTimeout(() => {
            const result = Auth.registerWithPhone(phone);

            Utils.hideLoading();

            if (result.success) {
                // Show success message with password
                this.showAuthSuccess(result.password);
            } else {
                this.showAuthError(result.error);
            }
        }, 500);
    },

    /**
     * Handle phone login
     */
    handlePhoneLogin() {
        const phone = document.getElementById('login-phone').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!phone || !password) {
            this.showAuthError('Telefon raqam va parolni kiriting');
            return;
        }

        Utils.showLoading('Tizimga kirilmoqda...');

        setTimeout(() => {
            const result = Auth.loginWithPhone(phone, password);

            Utils.hideLoading();

            if (result.success) {
                Utils.showToast('Muvaffaqiyatli kirdingiz!', 'success');
                // Proceed to generate ticket
                this.generateTicket();
            } else {
                this.showAuthError(result.error);
            }
        }, 500);
    },

    /**
     * Show authentication success message
     */
    showAuthSuccess(password) {
        // Hide forms
        document.querySelectorAll('.auth-option').forEach(el => el.style.display = 'none');
        document.querySelector('.auth-divider').style.display = 'none';

        // Show success message
        const successEl = document.getElementById('auth-success');
        successEl.classList.remove('hidden');

        // Display generated password
        document.getElementById('generated-password').textContent = password;
    },

    /**
     * Show authentication error message
     */
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        const errorMsg = document.getElementById('auth-error-message');

        errorMsg.textContent = message;
        errorEl.classList.remove('hidden');

        // Hide error after 5 seconds
        setTimeout(() => {
            errorEl.classList.add('hidden');
        }, 5000);
    },

    /**
     * Proceed to ticket generation after successful authentication
     */
    proceedToTicket() {
        this.generateTicket();
    },

    printTicket() {
        if (this.currentQueue) {
            QueueManager.printTicket(this.currentQueue.id);
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    QueueApp.init();
});
