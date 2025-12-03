// Staff Login Credentials
// Separate file for managing staff authentication data

const StaffCredentials = {
    // Staff login data - username: password mapping
    credentials: {
        'staff1': 'staff1pass',
        'staff2': 'staff2pass',
        'staff3': 'staff3pass',
        'staff4': 'staff4pass',
        'staff5': 'staff5pass',
        'staff6': 'staff6pass',
        'staff7': 'staff7pass',
        'staff8': 'staff8pass',
        'staff9': 'staff9pass',
        'staff10': 'staff10pass',
        'staff11': 'staff11pass',
        'staff12': 'staff12pass',
        'staff13': 'staff13pass',
        'staff14': 'staff14pass',
        'staff15': 'staff15pass',
        'staff16': 'staff16pass',
        'staff17': 'staff17pass',
        'staff18': 'staff18pass',
        'staff19': 'staff19pass',
        'staff20': 'staff20pass',
        'staff21': 'staff21pass',
        'staff22': 'staff22pass',
        'staff23': 'staff23pass',
        'staff24': 'staff24pass',
        'staff25': 'staff25pass',
        'staff26': 'staff26pass',
        'staff27': 'staff27pass',
        'staff28': 'staff28pass',
        'staff29': 'staff29pass',
        'staff30': 'staff30pass',
        'staff31': 'staff31pass',
        'staff32': 'staff32pass',
        'staff33': 'staff33pass',
        'staff34': 'staff34pass',
        'staff35': 'staff35pass',
        'staff36': 'staff36pass',
        'staff37': 'staff37pass',
        'staff38': 'staff38pass',
        'staff39': 'staff39pass',
        'staff40': 'staff40pass',
        'staff41': 'staff41pass',
        'staff42': 'staff42pass',
        'staff43': 'staff43pass',
        'staff44': 'staff44pass',
        'staff45': 'staff45pass',
        'staff46': 'staff46pass',
        'staff47': 'staff47pass',
        'staff48': 'staff48pass',
        'staff49': 'staff49pass',
        'staff50': 'staff50pass',
        'staff51': 'staff51pass',
        'staff52': 'staff52pass',
        'staff53': 'staff53pass',
        'staff54': 'staff54pass',
        'staff55': 'staff55pass',
        'staff56': 'staff56pass',
        'staff57': 'staff57pass',
        'staff58': 'staff58pass',
        'staff59': 'staff59pass',
        'staff60': 'staff60pass',
        'staff61': 'staff61pass',
        'staff62': 'staff62pass',
        'staff63': 'staff63pass',
        'staff64': 'staff64pass'
    },

    /**
     * Validate staff credentials
     * @param {string} username - Staff username
     * @param {string} password - Staff password
     * @returns {boolean} - True if credentials are valid
     */
    validate(username, password) {
        return this.credentials[username] === password;
    },

    /**
     * Get password for a username
     * @param {string} username - Staff username
     * @returns {string|null} - Password or null if not found
     */
    getPassword(username) {
        return this.credentials[username] || null;
    },

    /**
     * Check if username exists
     * @param {string} username - Staff username
     * @returns {boolean} - True if username exists
     */
    exists(username) {
        return username in this.credentials;
    },

    /**
     * Get staff ID from username
     * @param {string} username - Staff username (e.g., 'staff1')
     * @returns {string|null} - Staff ID (e.g., 'staff_1') or null if not found
     */
    getStaffId(username) {
        if (!this.exists(username)) {
            return null;
        }

        // Extract number from username (e.g., 'staff1' -> '1')
        const match = username.match(/staff(\d+)/);
        if (match && match[1]) {
            return `staff_${match[1]}`;
        }

        return null;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaffCredentials;
}
