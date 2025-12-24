// Operator AI - Database Management
// Handles all data storage and retrieval using LocalStorage and IndexedDB

const Database = {
    // Storage keys
    keys: {
        organizations: 'operatorai_organizations',
        branches: 'operatorai_branches',
        services: 'operatorai_services',
        staff: 'operatorai_staff',
        queues: 'operatorai_queues',
        queueCounter: 'operatorai_queue_counter',
        settings: 'operatorai_settings',
        users: 'operatorai_users'
    },

    /**
     * Initialize database with mock data
     */
    init() {
        // Check if already initialized
        if (this.get(this.keys.organizations)) {
            return;
        }

        // Create mock data
        this.createMockData();
    },

    /**
     * Get data from localStorage
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting data:', error);
            return null;
        }
    },

    /**
     * Set data to localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this.broadcastChange(key, value);
            return true;
        } catch (error) {
            console.error('Error setting data:', error);
            return false;
        }
    },

    /**
     * Delete data from localStorage
     */
    delete(key) {
        try {
            localStorage.removeItem(key);
            this.broadcastChange(key, null);
            return true;
        } catch (error) {
            console.error('Error deleting data:', error);
            return false;
        }
    },

    /**
     * Broadcast data changes to other tabs
     */
    broadcastChange(key, value) {
        window.dispatchEvent(new CustomEvent('databaseChange', {
            detail: { key, value }
        }));
    },

    /**
     * Get all organizations
     */
    getOrganizations() {
        return this.get(this.keys.organizations) || [];
    },

    /**
     * Get all queues with optional filters
     */
    getQueues(filters = {}) {
        let queues = this.get(this.keys.queues) || [];

        if (filters.branchId) {
            queues = queues.filter(q => q.branchId === filters.branchId);
        }
        if (filters.serviceId) {
            queues = queues.filter(q => q.serviceId === filters.serviceId);
        }
        if (filters.status) {
            queues = queues.filter(q => q.status === filters.status);
        }
        if (filters.date) {
            const filterDate = new Date(filters.date).toDateString();
            queues = queues.filter(q => new Date(q.createdAt).toDateString() === filterDate);
        }

        return queues;
    },

    /**
     * Get queue by ID
     */
    getQueue(id) {
        const queues = this.getQueues();
        return queues.find(q => q.id === id);
    },

    /**
     * Get queue by number
     */
    getQueueByNumber(queueNumber) {
        const queues = this.getQueues();
        return queues.find(q => q.queueNumber === queueNumber);
    },

    /**
     * Get branch by ID
     */
    getBranch(id) {
        const branches = this.get(this.keys.branches) || [];
        return branches.find(b => b.id === id);
    },

    /**
     * Get branches by organization ID
     */
    getBranches(orgId) {
        const branches = this.get(this.keys.branches) || [];
        if (orgId) {
            return branches.filter(b => b.organizationId === orgId);
        }
        return branches;
    },

    /**
     * Get service by ID
     */
    getService(id) {
        const services = this.get(this.keys.services) || [];
        return services.find(s => s.id === id);
    },

    /**
     * Get services by branch ID
     */
    getServices(branchId) {
        const services = this.get(this.keys.services) || [];
        if (branchId) {
            return services.filter(s => s.branchId === branchId);
        }
        return services;
    },

    /**
     * Get organization by ID
     */
    getOrganization(id) {
        const orgs = this.getOrganizations();
        return orgs.find(o => o.id === id);
    },

    /**
     * Get staff member by ID
     */
    getStaffMember(id) {
        const staff = this.get(this.keys.staff) || [];
        return staff.find(s => s.id === id);
    },

    /**
     * Get all staff
     */
    getStaff() {
        return this.get(this.keys.staff) || [];
    },

    /**
     * Update staff member
     */
    updateStaff(id, updates) {
        const staff = this.getStaff();
        const index = staff.findIndex(s => s.id === id);
        if (index !== -1) {
            staff[index] = { ...staff[index], ...updates };
            this.set(this.keys.staff, staff);
            return staff[index];
        }
        return null;
    },

    /**
     * Create new queue
     */
    createQueue(queueData) {
        const queues = this.getQueues();
        const branch = this.getBranch(queueData.branchId);
        const service = this.getService(queueData.serviceId);

        if (!branch || !service) {
            return null;
        }

        // Generate queue number
        const queueNumber = this.generateQueueNumber(branch.organizationId, service.category);

        // Calculate estimated wait time
        const waitingQueues = queues.filter(q =>
            q.branchId === queueData.branchId &&
            q.serviceId === queueData.serviceId &&
            (q.status === 'waiting' || q.status === 'called')
        );
        const estimatedWaitTime = waitingQueues.length * (service.estimatedDuration || 15);

        const newQueue = {
            id: Utils.generateId('queue_'),
            queueNumber,
            status: 'waiting',
            createdAt: new Date().toISOString(),
            estimatedWaitTime,
            priority: queueData.priority || 1,
            staffId: null,
            calledAt: null,
            servedAt: null,
            completedAt: null,
            notes: '',
            ...queueData
        };

        queues.push(newQueue);
        this.set(this.keys.queues, queues);

        return newQueue;
    },

    /**
     * Update queue
     */
    updateQueue(id, updates) {
        const queues = this.getQueues();
        const index = queues.findIndex(q => q.id === id);
        if (index !== -1) {
            queues[index] = { ...queues[index], ...updates };
            this.set(this.keys.queues, queues);
            return queues[index];
        }
        return null;
    },

    /**
     * Delete queue
     */
    deleteQueue(id) {
        const queues = this.getQueues();
        const filtered = queues.filter(q => q.id !== id);
        this.set(this.keys.queues, filtered);
        return true;
    },

    /**
     * Generate queue number
     */
    generateQueueNumber(organizationId, category) {
        const org = this.getOrganization(organizationId);
        const prefix = CONFIG.queue.prefixes[org?.type] || 'Z';

        // Get today's counter
        const counters = this.get(this.keys.queueCounter) || {};
        const today = new Date().toDateString();

        if (!counters[today]) {
            counters[today] = {};
        }

        if (!counters[today][prefix]) {
            counters[today][prefix] = 0;
        }

        counters[today][prefix]++;
        this.set(this.keys.queueCounter, counters);

        const number = String(counters[today][prefix]).padStart(3, '0');
        return `${prefix}-${number}`;
    },

    /**
     * Call next queue
     */
    callNextQueue(branchId, serviceId, staffId) {
        const queues = this.getQueues({
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
                return b.priority - a.priority; // Higher priority first
            }
            return new Date(a.createdAt) - new Date(b.createdAt); // Earlier first
        });

        const nextQueue = queues[0];

        return this.updateQueue(nextQueue.id, {
            status: 'called',
            staffId,
            calledAt: new Date().toISOString()
        });
    },

    /**
     * Mark queue as serving
     */
    startServing(queueId) {
        return this.updateQueue(queueId, {
            status: 'serving',
            servedAt: new Date().toISOString()
        });
    },

    /**
     * Mark queue as completed
     */
    completeQueue(queueId) {
        return this.updateQueue(queueId, {
            status: 'completed',
            completedAt: new Date().toISOString()
        });
    },

    /**
     * Mark queue as no-show
     */
    markNoShow(queueId) {
        return this.updateQueue(queueId, {
            status: 'no-show',
            completedAt: new Date().toISOString()
        });
    },

    /**
     * Cancel queue
     */
    cancelQueue(queueId) {
        return this.updateQueue(queueId, {
            status: 'cancelled',
            completedAt: new Date().toISOString()
        });
    },

    /**
     * Get queue statistics
     */
    getStatistics(branchId = null, date = new Date()) {
        const filterDate = new Date(date).toDateString();
        let queues = this.getQueues();

        // Filter by date
        queues = queues.filter(q => new Date(q.createdAt).toDateString() === filterDate);

        // Filter by branch if specified
        if (branchId) {
            queues = queues.filter(q => q.branchId === branchId);
        }

        const total = queues.length;
        const waiting = queues.filter(q => q.status === 'waiting').length;
        const called = queues.filter(q => q.status === 'called').length;
        const serving = queues.filter(q => q.status === 'serving').length;
        const completed = queues.filter(q => q.status === 'completed').length;
        const noShow = queues.filter(q => q.status === 'no-show').length;
        const cancelled = queues.filter(q => q.status === 'cancelled').length;

        // Calculate average times
        const completedQueues = queues.filter(q => q.status === 'completed' && q.completedAt);
        let avgWaitTime = 0;
        let avgServiceTime = 0;

        if (completedQueues.length > 0) {
            const waitTimes = completedQueues.map(q =>
                Utils.getTimeDifference(q.createdAt, q.calledAt || q.servedAt)
            );
            avgWaitTime = Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length);

            const serviceTimes = completedQueues.map(q =>
                Utils.getTimeDifference(q.servedAt || q.calledAt, q.completedAt)
            );
            avgServiceTime = Math.round(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length);
        }

        return {
            total,
            waiting,
            called,
            serving,
            completed,
            noShow,
            cancelled,
            active: waiting + called + serving,
            avgWaitTime,
            avgServiceTime,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    },

    /**
     * Create mock data for testing
     */
    createMockData() {
        // 1. Create Organizations
        const orgs = [
            {
                id: 'org_001',
                name: 'Aloqabank',
                type: 'bank',
                logo: '🏦',
                createdAt: new Date().toISOString()
            },
            {
                id: 'org_002',
                name: 'Shifokor Plus',
                type: 'clinic',
                logo: '🏥',
                createdAt: new Date().toISOString()
            },
            {
                id: 'org_003',
                name: 'Yunusobod Soliq Inspeksiyasi',
                type: 'tax',
                logo: '💼',
                createdAt: new Date().toISOString()
            },
            {
                id: 'org_004',
                name: 'IIV Migratsiya Xizmati',
                type: 'passport',
                logo: '📋',
                createdAt: new Date().toISOString()
            }
        ];
        this.set(this.keys.organizations, orgs);

        // 2. Create Branches (1 main branch per org)
        const branches = orgs.map((org, index) => ({
            id: `branch_00${index + 1}`,
            organizationId: org.id,
            name: `${org.name} - Bosh Ofis`,
            address: 'Toshkent sh., Amir Temur ko\'chasi',
            phone: '+998 71 200 00 00',
            location: { lat: 41.2995, lng: 69.2401 },
            operatingHours: CONFIG.defaultOperatingHours,
            isActive: true,
            createdAt: new Date().toISOString()
        }));
        this.set(this.keys.branches, branches);

        // 3. Create Services (Departments) - 4 per Organization
        const serviceTemplates = {
            bank: [
                { name: 'Kredit Bo\'limi', nameUz: 'Kredit Bo\'limi', nameRu: 'Кредитный отдел', nameEn: 'Credit Department', duration: 30 },
                { name: 'Kassa', nameUz: 'Kassa', nameRu: 'Касса', nameEn: 'Cashier', duration: 10 },
                { name: 'Valyuta Ayirboshlash', nameUz: 'Valyuta Ayirboshlash', nameRu: 'Обмен валюты', nameEn: 'Currency Exchange', duration: 5 },
                { name: 'Plastik Kartalar', nameUz: 'Plastik Kartalar', nameRu: 'Пластиковые карты', nameEn: 'Plastic Cards', duration: 15 }
            ],
            clinic: [
                { name: 'Terapevt', nameUz: 'Terapevt', nameRu: 'Терапевт', nameEn: 'Therapist', duration: 20 },
                { name: 'Jarroh', nameUz: 'Jarroh', nameRu: 'Хирург', nameEn: 'Surgeon', duration: 25 },
                { name: 'Ko\'z Shifokori', nameUz: 'Ko\'z Shifokori', nameRu: 'Окулист', nameEn: 'Ophthalmologist', duration: 15 },
                { name: 'Laboratoriya', nameUz: 'Laboratoriya', nameRu: 'Лаборатория', nameEn: 'Laboratory', duration: 10 }
            ],
            tax: [
                { name: 'Jismoniy Shaxslar', nameUz: 'Jismoniy Shaxslar', nameRu: 'Физ. лица', nameEn: 'Individuals', duration: 20 },
                { name: 'Yuridik Shaxslar', nameUz: 'Yuridik Shaxslar', nameRu: 'Юр. лица', nameEn: 'Legal Entities', duration: 30 },
                { name: 'Deklaratsiya', nameUz: 'Deklaratsiya', nameRu: 'Декларация', nameEn: 'Declaration', duration: 25 },
                { name: 'Maslahat Xizmati', nameUz: 'Maslahat Xizmati', nameRu: 'Консультация', nameEn: 'Consultation', duration: 15 }
            ],
            passport: [
                { name: 'Zagran Pasport', nameUz: 'Zagran Pasport', nameRu: 'Загранпаспорт', nameEn: 'International Passport', duration: 20 },
                { name: 'ID Karta', nameUz: 'ID Karta', nameRu: 'ID Карта', nameEn: 'ID Card', duration: 15 },
                { name: 'Propiska', nameUz: 'Propiska', nameRu: 'Прописка', nameEn: 'Registration', duration: 15 },
                { name: 'Fuqarolik', nameUz: 'Fuqarolik', nameRu: 'Гражданство', nameEn: 'Citizenship', duration: 30 }
            ]
        };

        let services = [];
        let staff = [];
        let staffCounter = 1;

        // Helper to generate staff names
        const firstNames = ['Aziz', 'Bobur', 'Jamshid', 'Dilshod', 'Malika', 'Nargiza', 'Shahlo', 'Umida', 'Jasur', 'Sardor', 'Farhod', 'Otabek', 'Sevara', 'Laylo', 'Kamola', 'Zilola'];
        const lastNames = ['Karimov', 'Rahimov', 'Abdullayev', 'Tursunov', 'Yusupov', 'Aliyev', 'Umarov', 'Ahmedov', 'Saidov', 'Rustamov'];

        branches.forEach((branch, bIndex) => {
            const orgType = orgs[bIndex].type;
            const templates = serviceTemplates[orgType];

            templates.forEach((template, sIndex) => {
                const serviceId = `service_${branch.id}_${sIndex + 1}`;

                // Add Service
                services.push({
                    id: serviceId,
                    branchId: branch.id,
                    name: template.name,
                    nameUz: template.nameUz,
                    nameRu: template.nameRu,
                    nameEn: template.nameEn,
                    category: orgType,
                    estimatedDuration: template.duration,
                    priority: 1,
                    isActive: true,
                    createdAt: new Date().toISOString()
                });

                // Add 4 Staff for this Service
                for (let i = 0; i < 4; i++) {
                    const firstName = Utils.randomItem(firstNames);
                    const lastName = Utils.randomItem(lastNames);

                    staff.push({
                        id: `staff_${staffCounter++}`,
                        branchId: branch.id,
                        name: `${firstName} ${lastName}`,
                        role: 'operator',
                        services: [serviceId], // Dedicated to this service/department
                        counter: `${(sIndex * 4) + i + 1}-Xona`, // Room/Window number
                        isActive: true,
                        currentQueue: null,
                        createdAt: new Date().toISOString()
                    });
                }
            });
        });

        this.set(this.keys.services, services);
        this.set(this.keys.staff, staff);

        // Create some sample queues
        const now = new Date();
        const queues = [];

        // Generate some random queues for today
        services.forEach(service => {
            // 2-3 active queues per service
            for (let i = 0; i < 3; i++) {
                queues.push({
                    id: Utils.generateId('queue_'),
                    queueNumber: this.generateQueueNumber(this.getBranch(service.branchId).organizationId, service.category),
                    branchId: service.branchId,
                    serviceId: service.id,
                    staffId: null,
                    status: 'waiting',
                    createdAt: new Date(now.getTime() - Math.random() * 3600000).toISOString(),
                    estimatedWaitTime: service.estimatedDuration * (i + 1),
                    priority: 1
                });
            }
        });

        this.set(this.keys.queues, queues);

        // Initialize queue counter
        const today = new Date().toDateString();
        this.set(this.keys.queueCounter, {
            [today]: { 'A': 15, 'B': 12, 'C': 8, 'D': 10, 'E': 5 }
        });

        console.log('Mock data created: 4 Orgs, 16 Services, 64 Staff');
    },

    /**
     * Clear all data
     */
    clearAll() {
        Object.values(this.keys).forEach(key => {
            this.delete(key);
        });
    },

    /**
     * Export all data
     */
    exportData() {
        const data = {};
        Object.entries(this.keys).forEach(([name, key]) => {
            data[name] = this.get(key);
        });
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.entries(data).forEach(([name, value]) => {
                if (this.keys[name]) {
                    this.set(this.keys[name], value);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// Initialize database on load
Database.init();

// Listen for storage changes from other tabs
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('operatorai_')) {
        window.dispatchEvent(new CustomEvent('databaseChange', {
            detail: { key: e.key, value: e.newValue ? JSON.parse(e.newValue) : null }
        }));
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Database;
}
