// Admin Credentials Configuration
// IMPORTANT: Change these values before deploying to production!

const AdminConfig = {
    // Default admin credentials (CHANGE THESE!)
    username: 'admin',
    password: 'change_this_password', // TODO: Use environment variables in production

    // Session settings
    sessionKey: 'admin_auth',
    sessionTimeout: 3600000 // 1 hour in milliseconds
};

// Export for use in admin-login.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminConfig;
}
