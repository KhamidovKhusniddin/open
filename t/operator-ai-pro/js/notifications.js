// Operator AI - Notification System
// Simulates SMS and Email notifications

const NotificationService = {
    /**
     * Send SMS notification
     */
    sendSMS(phoneNumber, message) {
        console.log(`[SMS Simulation] To: ${phoneNumber}, Message: ${message}`);

        // Simulate API delay
        setTimeout(() => {
            this.showToast(`SMS sent to ${phoneNumber}`, 'success');
        }, 1000);

        return true;
    },

    /**
     * Send Email notification
     */
    sendEmail(email, subject, body) {
        console.log(`[Email Simulation] To: ${email}, Subject: ${subject}`);
        console.log(`Body: ${body}`);

        // Simulate API delay
        setTimeout(() => {
            this.showToast(`Email sent to ${email}`, 'success');
        }, 1500);

        return true;
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#34c759' : '#007aff'};
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    /**
     * Request permission for browser notifications
     */
    requestPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    },

    /**
     * Send browser notification
     */
    sendBrowserNotification(title, options) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }
    }
};

// Add styles for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}
