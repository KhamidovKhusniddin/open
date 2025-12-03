// Operator AI - Configuration File
// Central configuration for the entire application

const CONFIG = {
    // Application Info
    app: {
        name: 'Operator AI',
        version: '1.0.0',
        description: 'Professional Queue Management System',
        author: 'Operator AI Team',
        defaultLanguage: 'uz'
    },

    // API Configuration (for future backend integration)
    api: {
        baseURL: 'http://localhost:3000/api',
        timeout: 10000,
        endpoints: {
            organizations: '/organizations',
            branches: '/branches',
            services: '/services',
            staff: '/staff',
            queues: '/queues',
            analytics: '/analytics'
        }
    },

    // Storage Configuration
    storage: {
        prefix: 'operatorai_',
        useIndexedDB: true,
        syncInterval: 3000 // 3 seconds
    },

    // Queue Configuration
    queue: {
        prefixes: {
            bank: 'A',
            clinic: 'B',
            government: 'C',
            passport: 'D',
            tax: 'E',
            other: 'Z'
        },
        resetTime: '00:00', // Reset counters at midnight
        defaultPriority: 1,
        estimatedServiceTime: 15 // minutes
    },

    // Notification Configuration
    notifications: {
        enabled: true,
        sound: true,
        browser: true,
        beforeCallMinutes: 5, // Notify 5 minutes before turn
        sms: {
            enabled: false, // Requires API integration
            provider: 'eskiz.uz'
        },
        email: {
            enabled: false, // Requires API integration
            provider: 'smtp'
        }
    },

    // Display Configuration
    display: {
        refreshInterval: 2000, // 2 seconds
        showCount: 5, // Show last 5 called numbers
        voiceEnabled: true,
        voiceLanguage: 'uz-UZ',
        animationDuration: 500 // ms
    },

    // Analytics Configuration
    analytics: {
        trackingEnabled: true,
        reportTypes: ['daily', 'weekly', 'monthly'],
        metrics: [
            'totalQueues',
            'averageWaitTime',
            'averageServiceTime',
            'completionRate',
            'peakHours',
            'staffEfficiency'
        ]
    },

    // UI Configuration
    ui: {
        theme: 'light', // light or dark
        animations: true,
        toastDuration: 3000, // ms
        modalBackdrop: true
    },

    // Security Configuration
    security: {
        sessionTimeout: 3600000, // 1 hour in ms
        maxLoginAttempts: 5,
        passwordMinLength: 8
    },

    // Supported Languages
    languages: [
        { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' },
        { code: 'en', name: 'English', flag: '🇬🇧' }
    ],

    // Organization Types
    organizationTypes: [
        { id: 'bank', nameUz: 'Bank', nameRu: 'Банк', nameEn: 'Bank', icon: '\uD83C\uDFE6' }, // 🏦
        { id: 'clinic', nameUz: 'Klinika', nameRu: 'Клиника', nameEn: 'Clinic', icon: '\uD83C\uDFE5' }, // 🏥
        { id: 'government', nameUz: 'Davlat xizmati', nameRu: 'Государственная служба', nameEn: 'Government Service', icon: '\uD83C\uDFDB\uFE0F' }, // 🏛️
        { id: 'passport', nameUz: 'Pasport xizmati', nameRu: 'Паспортная служба', nameEn: 'Passport Service', icon: '\uD83D\uDCCB' }, // 📋
        { id: 'tax', nameUz: 'Soliq xizmati', nameRu: 'Налоговая служба', nameEn: 'Tax Service', icon: '\uD83D\uDCBC' } // 💼
    ],

    // Default Operating Hours
    defaultOperatingHours: {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '14:00', isOpen: true },
        sunday: { open: '00:00', close: '00:00', isOpen: false }
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(CONFIG);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
