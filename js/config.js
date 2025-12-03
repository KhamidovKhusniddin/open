const CONFIG = {
    organizationTypes: [
        {
            id: 'bank',
            name: 'Bank',
            nameUz: 'Bank',
            icon: '🏦'
        },
        {
            id: 'clinic',
            name: 'Clinic',
            nameUz: 'Klinika',
            icon: '🏥'
        },
        {
            id: 'tax',
            name: 'Tax Service',
            nameUz: 'Soliq Xizmati',
            icon: '💼'
        },
        {
            id: 'passport',
            name: 'Passport Service',
            nameUz: 'Pasport Xizmati',
            icon: '📋'
        }
    ],
    queue: {
        prefixes: {
            bank: 'B',
            clinic: 'M',
            tax: 'S',
            passport: 'P'
        }
    },
    defaultOperatingHours: {
        open: '09:00',
        close: '18:00',
        weekend: ['Saturday', 'Sunday']
    },
    notifications: {
        sound: false,
        browser: true
    },
    display: {
        voiceEnabled: false,
        voiceLanguage: 'uz-UZ'
    },
    storage: {
        syncInterval: 5000
    }
};

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
