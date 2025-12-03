// Authentication Service
// Handles user registration and login via Telegram and Phone

const Auth = {
    // Storage keys
    SESSION_KEY: 'operatorai_session',

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated() {
        const session = this.getSession();
        return session !== null && session.userId !== null;
    },

    /**
     * Get current session
     */
    getSession() {
        try {
            const session = localStorage.getItem(this.SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        const session = this.getSession();
        if (!session || !session.userId) {
            return null;
        }

        const users = Database.get(Database.keys.users) || [];
        return users.find(u => u.id === session.userId) || null;
    },

    /**
     * Set session
     */
    setSession(userId, userData) {
        const session = {
            userId,
            loginTime: new Date().toISOString(),
            userData
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return session;
    },

    /**
     * Clear session (logout)
     */
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        return true;
    },

    /**
     * Generate random password
     */
    generatePassword() {
        const length = 6;
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    /**
     * Validate phone number format
     */
    validatePhone(phone) {
        // Uzbekistan phone format: +998XXXXXXXXX
        const phoneRegex = /^\+998[0-9]{9}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Register new user with phone number
     */
    registerWithPhone(phone) {
        if (!this.validatePhone(phone)) {
            return {
                success: false,
                error: 'Telefon raqam formati noto\'g\'ri. Format: +998XXXXXXXXX'
            };
        }

        // Check if user already exists
        const existingUser = Database.getUserByPhone(phone);
        if (existingUser) {
            return {
                success: false,
                error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan. Iltimos, kirish tugmasini bosing.'
            };
        }

        // Generate password
        const password = this.generatePassword();

        // Create new user
        const userData = {
            id: Utils.generateId('user_'),
            phone,
            password, // In production, this should be hashed
            registrationType: 'phone',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        const user = Database.createUser(userData);

        if (user) {
            // Set session
            this.setSession(user.id, {
                phone: user.phone,
                registrationType: user.registrationType
            });

            return {
                success: true,
                user,
                password // Return password to display to user
            };
        }

        return {
            success: false,
            error: 'Ro\'yxatdan o\'tishda xatolik yuz berdi'
        };
    },

    /**
     * Login with phone and password
     */
    loginWithPhone(phone, password) {
        if (!this.validatePhone(phone)) {
            return {
                success: false,
                error: 'Telefon raqam formati noto\'g\'ri'
            };
        }

        if (!password || password.trim() === '') {
            return {
                success: false,
                error: 'Parolni kiriting'
            };
        }

        // Get user by phone
        const user = Database.getUserByPhone(phone);

        if (!user) {
            return {
                success: false,
                error: 'Foydalanuvchi topilmadi. Iltimos, ro\'yxatdan o\'ting.'
            };
        }

        // Verify password
        if (user.password !== password.trim()) {
            return {
                success: false,
                error: 'Parol noto\'g\'ri'
            };
        }

        // Update last login
        Database.updateUser(user.id, {
            lastLogin: new Date().toISOString()
        });

        // Set session
        this.setSession(user.id, {
            phone: user.phone,
            registrationType: user.registrationType
        });

        return {
            success: true,
            user
        };
    },

    /**
     * Simulated Telegram authentication
     * In production, this would integrate with Telegram Bot API
     */
    loginWithTelegram(telegramData = null) {
        // Simulate Telegram authentication
        // In real implementation, you would:
        // 1. Open Telegram login widget
        // 2. Receive callback with user data
        // 3. Verify the data with Telegram servers

        // For simulation, generate fake Telegram data
        const simulatedData = telegramData || {
            id: Math.floor(Math.random() * 1000000000),
            first_name: 'Telegram',
            last_name: 'User',
            username: 'telegram_user_' + Math.floor(Math.random() * 10000),
            photo_url: '',
            auth_date: Math.floor(Date.now() / 1000)
        };

        // Check if user exists by Telegram ID
        let user = Database.getUserByTelegramId(simulatedData.id.toString());

        if (!user) {
            // Create new user
            const userData = {
                id: Utils.generateId('user_'),
                telegramId: simulatedData.id.toString(),
                telegramUsername: simulatedData.username,
                telegramFirstName: simulatedData.first_name,
                telegramLastName: simulatedData.last_name,
                registrationType: 'telegram',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            user = Database.createUser(userData);
        } else {
            // Update last login
            Database.updateUser(user.id, {
                lastLogin: new Date().toISOString()
            });
        }

        if (user) {
            // Set session
            this.setSession(user.id, {
                telegramId: user.telegramId,
                telegramUsername: user.telegramUsername,
                registrationType: user.registrationType
            });

            return {
                success: true,
                user
            };
        }

        return {
            success: false,
            error: 'Telegram orqali kirishda xatolik yuz berdi'
        };
    },

    /**
     * Require authentication
     * Returns current user if authenticated, null otherwise
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            return null;
        }
        return this.getCurrentUser();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
