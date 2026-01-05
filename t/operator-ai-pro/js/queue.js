// Queue Interface JavaScript

const QueueApp = {
    currentStep: 1,
    selectedOrg: null,
    selectedBranch: null,
    selectedService: null,
    selectedStaff: null,
    selectedDate: null,
    selectedTime: null,
    userPhone: '',
    verificationCode: null,
    currentQueue: null,
    botUsername: 'queuemanageruzbot', // Fallback, updated via API

    init() {
        this.loadOrganizations();
        this.startRealTimeUpdates();
        this.setupDateInput();
        this.setupCodeInputs();
        this.fetchBotInfo();
    },

    async fetchBotInfo() {
        try {
            // In local env this might fail if full url not set, relying on relative path proxy or logic
            const resp = await fetch(`${CONFIG.api.verificationURL}/api/config/bot`);
            const data = await resp.json();
            if (data.success && data.username) {
                this.botUsername = data.username;
            }
        } catch (e) {
            console.error('Failed to fetch bot info', e);
        }
    },

    goToStep(step) {
        const direction = step > this.currentStep ? 'next' : 'prev';
        const currentStepEl = document.getElementById(`step-${this.currentStep}`);
        const nextStepEl = document.getElementById(`step-${step}`);

        // If it's the first load or same step (shouldn't happen), just show
        if (!currentStepEl || step === this.currentStep) {
            this.showStepImmediately(step);
            return;
        }

        // Animate Out Current
        currentStepEl.classList.remove('slide-in-right', 'slide-in-left', 'hidden');
        currentStepEl.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

        // Wait for animation to finish then hide and show next
        setTimeout(() => {
            currentStepEl.classList.add('hidden');
            currentStepEl.classList.remove('slide-out-left', 'slide-out-right');

            if (nextStepEl) {
                nextStepEl.classList.remove('hidden', 'slide-out-left', 'slide-out-right');
                nextStepEl.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 400); // slightly less than css animation time 0.5s to feel snappy

        // Update step indicator
        this.updateStepIndicator(step);
        this.currentStep = step;
    },

    showStepImmediately(step) {
        document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl) {
            stepEl.classList.remove('hidden');
            stepEl.classList.add('animate-fadeIn'); // simple fade for first load
        }
        this.updateStepIndicator(step);
        this.currentStep = step;
    },

    updateStepIndicator(step) {
        document.querySelectorAll('.step-item').forEach((el) => {
            el.classList.remove('active', 'completed');
            const stepNum = parseInt(el.dataset.step);
            if (stepNum < step) {
                el.classList.add('completed');
            } else if (stepNum === step) {
                el.classList.add('active');
            }
        });
    },

    loadOrganizations() {
        const orgs = Database.getOrganizations();
        const grid = document.getElementById('organizations-grid');

        grid.innerHTML = orgs.map(org => {
            const orgType = CONFIG.organizationTypes.find(t => t.id === org.type);
            return `
        <div class="org-item" onclick="QueueApp.selectOrganization('${org.id}')">
          <span class="item-icon">${orgType?.icon || '🏢'}</span>
          <div class="item-name">${org.name}</div>
          <div class="item-desc">${orgType?.nameUz || org.type}</div>
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
      <div class="branch-item" onclick="QueueApp.selectBranch('${branch.id}')">
        <span class="item-icon">🏢</span>
        <div class="item-name">${branch.name}</div>
        <div class="item-desc">${branch.address}</div>
        <div class="branch-info" style="margin-top:1rem; font-size:0.9rem; opacity:0.8;">
           <span>${branch.isActive ? '🟢 Faol' : '🔴 Yopiq'}</span>
        </div>
      </div>
    `).join('');
    },

    selectBranch(branchId) {
        this.selectedBranch = branchId;
        this.loadServices(branchId);
        this.goToStep(3);
    },

    async loadServices(branchId) {
        const services = Database.getServices(branchId);
        const grid = document.getElementById('services-grid');

        if (services.length === 0) {
            grid.innerHTML = '<p class="text-center">Xizmatlar topilmadi</p>';
            return;
        }

        // Fetch real-time wait times from backend
        let waitTimes = {};
        try {
            const resp = await fetch(`${CONFIG.api.verificationURL}/api/branch-wait-times?branch_id=${branchId}`);
            const data = await resp.json();
            if (data.success) {
                waitTimes = data.wait_times;
            }
        } catch (e) {
            console.error("Wait times fetch failed", e);
        }

        grid.innerHTML = services.map(service => {
            const waitInfo = waitTimes[service.id];
            const waitText = waitInfo ?
                `<span style="color:var(--primary-color)">⏳ ${waitInfo.wait_time} daqiqa kutiladi (${waitInfo.people} kishi)</span>` :
                `<span>⏱ ~${service.estimatedDuration} daqiqa</span>`;

            return `
              <div class="service-item" id="service-${service.id}" onclick="QueueApp.selectService('${service.id}')">
                <span class="item-icon">📋</span>
                <div class="item-name">${service.name}</div>
                <div class="item-desc">${service.nameUz || service.name}</div>
                <div class="service-duration" style="margin-top:0.5rem; font-size:0.85rem;">
                   ${waitText}
                </div>
              </div>
            `;
        }).join('');
    },

    async selectService(serviceId) {
        this.selectedService = serviceId;

        // Highlight selected service
        document.querySelectorAll('.service-item').forEach(el => el.classList.remove('selected'));
        document.getElementById(`service-${serviceId}`).classList.add('selected');

        // Load staff for this service
        await this.loadStaffForService(serviceId);

        // Go to Staff Selection Step
        this.goToStep(4);
    },

    async loadStaffForService(serviceId) {
        const staffList = Database.getStaff().filter(s => s.services.includes(serviceId) && s.branchId === this.selectedBranch);
        const staffGrid = document.getElementById('staff-grid');

        if (staffList.length === 0) {
            // No staff found, might auto-skip or show message
            // For now, let user click "Any Staff" or valid logic:
            staffGrid.innerHTML = '<p>Hozircha bo\'sh mutaxassislar yo\'q. "Istalgan mutaxassis" ni tanlang.</p>';
            this.selectedStaff = 'anyone'; // Automatically select 'anyone' if no specific staff
            return;
        }

        // --- Fetch Staff Load Logic ---
        let staffLoads = {};
        try {
            const response = await fetch(`${CONFIG.api.verificationURL}/api/staff-load`);
            const data = await response.json();
            if (data.success) {
                staffLoads = data.loads;
            }
        } catch (e) {
            console.error("Failed to fetch staff load:", e);
        }

        // Find recommended staff (min load)
        let minLoad = Infinity;
        staffList.forEach(staff => {
            const load = staffLoads[staff.id] || 0;
            if (load < minLoad) minLoad = load;
        });

        // Mark recommended
        const enhancedStaffList = staffList.map(staff => {
            const load = staffLoads[staff.id] || 0;
            return {
                ...staff,
                load,
                isRecommended: load === minLoad
            };
        });

        // Sort: Recommended first
        enhancedStaffList.sort((a, b) => {
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            return 0;
        });

        staffGrid.innerHTML = enhancedStaffList.map(staff => `
            <div class="staff-item ${staff.isRecommended ? 'recommended' : ''}" id="staff-${staff.id}" onclick="QueueApp.selectStaff('${staff.id}')">
                ${staff.isRecommended ? '<div class="recommend-badge">⭐ Tavsiya etiladi</div>' : ''}
                <div class="item-icon" style="font-size:3rem;">👨‍💼</div>
                <div class="item-name">${staff.name}</div>
                <div class="item-desc">${staff.counter || 'Mutaxassis'}</div>
                <div class="staff-load" style="font-size:0.8rem; opacity:0.7; margin-top:0.5rem;">
                   Navbatda: ${staff.load} kishi
                </div>
            </div>
        `).join('');
    },

    selectStaff(staffId) {
        this.selectedStaff = staffId;

        // Visual feedback
        document.querySelectorAll('.staff-item').forEach(el => el.classList.remove('selected'));
        if (staffId !== 'anyone') {
            const el = document.getElementById(`staff-${staffId}`);
            if (el) el.classList.add('selected');
        }

        setTimeout(() => this.goToStep(5), 300); // Go to Date/Time
    },

    setupDateInput() {
        const dateInput = document.getElementById('booking-date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);

        dateInput.addEventListener('change', (e) => {
            this.selectedDate = e.target.value;
            this.loadTimeSlots(this.selectedDate);
        });
    },

    async loadTimeSlots(date) {
        const timeSelection = document.getElementById('time-selection');
        const slotsGrid = document.getElementById('time-slots');
        timeSelection.classList.remove('hidden');

        // Generate slots from 09:00 to 18:00
        const slots = [];
        for (let hour = 9; hour < 18; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }

        // --- FETCH BOOKED SLOTS FROM BACKEND ---
        let bookedTimes = [];
        try {
            const url = `${CONFIG.api.verificationURL}/api/booked-slots?date=${date}&branch_id=${this.selectedBranch}&staff_id=${this.selectedStaff}`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.success) {
                bookedTimes = data.slots;
            }
        } catch (e) {
            console.error("Failed to fetch booked slots:", e);
        }
        // ---------------------------------------

        slotsGrid.innerHTML = slots.map(time => {
            const isBooked = bookedTimes.includes(time);
            return `
                <div class="time-slot ${isBooked ? 'disabled' : ''}" 
                     onclick="${isBooked ? '' : `QueueApp.selectTime('${time}')`}"
                     id="time-${time.replace(':', '')}">
                    ${time}
                </div>
            `;
        }).join('');
    },

    selectTime(time) {
        this.selectedTime = time;
        document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
        document.getElementById(`time-${time.replace(':', '')}`).classList.add('selected');
        document.getElementById('confirm-datetime').disabled = false;
    },

    proceedToVerification() {
        this.goToStep(6);
    },

    setupCodeInputs() {
        const inputs = document.querySelectorAll('.code-input');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    },

    async sendVerificationCode() {
        const phone = document.getElementById('user-phone').value.replace(/\D/g, '');
        if (!phone || phone.length < 9) {
            Utils.showToast('Iltimos, to\'g\'ri telefon raqamini kiriting', 'error');
            return;
        }
        this.userPhone = phone;

        // Generate UID if needed
        if (!this.sessionUID) {
            this.sessionUID = Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        Utils.showLoading('Kod yuborilmoqda...');

        try {
            // Attempt to send code via Backend
            const resp = await fetch(`${CONFIG.api.verificationURL}/api/auth/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+${phone}`, uid: this.sessionUID })
            });
            const data = await resp.json();

            if (data.success) {
                // Code sent successfully!
                this.verificationCode = data.code; // Note: In prod, verify on backend. Here we simulate.
                Utils.showToast('Kod yuborildi!', 'success');
                Utils.hideLoading();
                document.getElementById('phone-entry').classList.add('hidden');
                document.getElementById('code-entry').classList.remove('hidden');
                return;
            }

            // If 404, User not found -> Show Bot Link
            if (resp.status === 404) {
                this.showBotLink();
                this.startBackendPolling(); // Poll backend instead of Telegram directly
            } else {
                throw new Error(data.message || 'Unknown error');
            }

        } catch (e) {
            console.error("Send code error:", e);
            Utils.showToast("Xatolik: " + e.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    showBotLink() {
        const linkContainer = document.getElementById('telegram-link-container');
        if (linkContainer) {
            linkContainer.classList.remove('hidden');
            const botLink = document.getElementById('bot-link');
            if (botLink) {
                botLink.href = `https://t.me/${this.botUsername}?start=${this.sessionUID}`;
                botLink.innerHTML = `Telegram Botni ochish`;
            }
            const statusEl = document.getElementById('polling-status');
            if (statusEl) statusEl.textContent = "Botni ishga tushirishingiz kutilmoqda...";
        }
    },

    async startBackendPolling() {
        const statusEl = document.getElementById('polling-status');
        let attempts = 0;
        let found = false;

        while (attempts < 30 && !found) {
            if (statusEl) statusEl.textContent = `Tasdiqlash kutilmoqda (${attempts}/30)...`;

            try {
                const resp = await fetch(`${CONFIG.api.verificationURL}/api/auth/check-status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: this.sessionUID, phone: this.userPhone })
                });
                const data = await resp.json();

                if (data.found) {
                    found = true;
                    if (statusEl) statusEl.textContent = "Siz tasdiqlandingiz! Kod yuborilmoqda...";
                    // Retry sending code
                    this.sendVerificationCode();
                    return;
                }
            } catch (e) { console.warn("Polling error", e); }

            attempts++;
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!found && statusEl) {
            statusEl.textContent = "Vaqt tugadi. Iltimos qaytadan urining.";
        }
    },

    // Legacy method removed, kept empty wrapper if called elsewhere
    manualChatId() {
        // logic removed
    },

    // Legacy method removed
    findChatIdByUID(uid, phone) {
        return null;
    },

    verifyCode() {
        const inputs = document.querySelectorAll('.code-input');
        let code = '';
        inputs.forEach(input => code += input.value);

        if (code === this.verificationCode) {
            this.createQueue();
        } else {
            Utils.showToast('Noto\'g\'ri kod kiritildi', 'error');
        }
    },

    createQueue() {
        Utils.showLoading('Bron qilinmoqda...');

        setTimeout(() => {
            const queueData = {
                branchId: this.selectedBranch,
                serviceId: this.selectedService,
                staffId: this.selectedStaff === 'anyone' ? null : this.selectedStaff,
                date: this.selectedDate,
                time: this.selectedTime,
                customerInfo: {
                    phone: this.userPhone
                }
            };

            const queue = Database.createQueue(queueData);

            if (queue) {
                this.currentQueue = queue;

                // Sync with backend for automated notifications
                fetch(`${CONFIG.api.verificationURL}/api/queues`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: queue.id,
                        phone: this.userPhone,
                        number: queue.queueNumber,
                        status: queue.status,
                        date: queue.date,
                        time: queue.time,
                        branchId: this.selectedBranch,
                        serviceId: this.selectedService,
                        staffId: this.selectedStaff === 'anyone' ? null : this.selectedStaff
                    })
                }).catch(err => console.error('Sync failed:', err));

                // Redirect to Ticket Page instead of tracker
                setTimeout(() => {
                    window.location.href = `ticket.html?id=${queue.id}`;
                }, 1500);
            } else {
                Utils.showToast('Xatolik yuz berdi', 'error');
            }

            Utils.hideLoading();
        }, 1000);
    },

    displayTicket(queue) {
        const org = Database.getOrganization(this.selectedOrg);
        const branch = Database.getBranch(queue.branchId);
        const service = Database.getService(queue.serviceId);
        const staff = queue.staffId ? Database.getStaffMember(queue.staffId) : null;

        document.getElementById('ticket-org').textContent = org.name;
        document.getElementById('ticket-branch').textContent = branch.name;
        document.getElementById('ticket-number').textContent = queue.queueNumber;
        document.getElementById('ticket-service').textContent = service.name;
        document.getElementById('ticket-staff').textContent = staff ? staff.name : 'Istalgan mutaxassis';
        document.getElementById('ticket-time').textContent = queue.time;
        document.getElementById('ticket-date').textContent = queue.date;

        const qrContent = `${window.location.origin}/tracker.html?id=${queue.id}`;
        const qrContainer = document.querySelector('.ticket-qr');
        const qrImg = document.getElementById('ticket-qr-code');

        if (qrContainer && typeof QRCode !== 'undefined') {
            // Check if we already have a container for QRCode, otherwise use the existing parent
            qrContainer.innerHTML = ''; // This will remove the old img and text
            const qrWrapper = document.createElement('div');
            qrWrapper.id = 'qrcode-wrapper';
            qrContainer.appendChild(qrWrapper);

            new QRCode(qrWrapper, {
                text: qrContent,
                width: 150,
                height: 150,
                colorDark: "#0f172a",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // Re-add the BIG Number text that was inside qrContainer
            const bigNum = document.createElement('span');
            bigNum.id = 'ticket-number-big';
            bigNum.style = 'font-size: 3.5rem; font-weight: 800; color: var(--primary-color); line-height: 1; font-family: var(--font-display); text-shadow: var(--glow-primary); margin-top: 1rem;';
            bigNum.textContent = queue.queueNumber;
            qrContainer.appendChild(bigNum);
        } else if (qrImg) {
            qrImg.src = Utils.generateQRCode(qrContent, 150);
            document.getElementById('ticket-number-big').textContent = queue.queueNumber;
        }
    },

    startRealTimeUpdates() {
        QueueManager.subscribe(() => {
            // Real-time updates logic if needed
        });
    },

    printTicket() {
        if (this.currentQueue) {
            QueueManager.printTicket(this.currentQueue.id);
        }
    },

    reset() {
        location.reload(); // Simplest way to reset the whole app state
    }
};

document.addEventListener('DOMContentLoaded', () => {
    QueueApp.init();
});
