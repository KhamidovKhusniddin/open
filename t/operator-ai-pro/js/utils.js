// Operator AI - Utility Functions
// Common helper functions used throughout the application

const Utils = {
    /**
     * Generate unique ID
     */
    generateId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    },

    /**
     * Format date and time
     */
    formatDate(date, format = 'full') {
        const d = new Date(date);
        const options = {
            full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
            date: { year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        return d.toLocaleString('uz-UZ', options[format] || options.full);
    },

    /**
     * Format time duration in minutes to readable format
     */
    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} daqiqa`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} soat ${mins > 0 ? mins + ' daqiqa' : ''}`;
    },

    /**
     * Calculate time difference in minutes
     */
    getTimeDifference(startTime, endTime = new Date()) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.floor((end - start) / 60000); // Convert ms to minutes
    },

    /**
     * Debounce function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Validate email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate phone number (Uzbekistan format)
     */
    isValidPhone(phone) {
        const re = /^\+998[0-9]{9}$/;
        return re.test(phone);
    },

    /**
     * Format phone number
     */
    formatPhone(phone) {
        // Convert to +998 XX XXX XX XX format
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 12 && cleaned.startsWith('998')) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
        }
        return phone;
    },

    /**
     * Generate random color
     */
    randomColor() {
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    },

    /**
     * Get contrast color (black or white) for given background
     */
    getContrastColor(hexColor) {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    },

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    },

    /**
     * Download data as file
     */
    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${this.getToastIcon(type)}</span>
        <span class="toast-message">${this.sanitizeHTML(message)}</span>
      </div>
    `;

        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Get icon for toast type
     */
    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    },

    /**
     * Show loading spinner
     */
    showLoading(message = 'Yuklanmoqda...') {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'global-loader';
        loader.innerHTML = `
      <div class="loader-content">
        <div class="spinner"></div>
        <p>${this.sanitizeHTML(message)}</p>
      </div>
    `;
        document.body.appendChild(loader);
    },

    /**
     * Hide loading spinner
     */
    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    },

    /**
     * Confirm dialog
     */
    confirm(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
      <div class="confirm-backdrop"></div>
      <div class="confirm-dialog">
        <div class="confirm-content">
          <p>${this.sanitizeHTML(message)}</p>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" data-action="cancel">Bekor qilish</button>
          <button class="btn btn-primary" data-action="confirm">Tasdiqlash</button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            modal.remove();
            if (onConfirm) onConfirm();
        });

        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });

        modal.querySelector('.confirm-backdrop').addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });
    },

    /**
     * Get current time in HH:MM format
     */
    getCurrentTime() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    },

    /**
     * Check if time is between two times
     */
    isTimeBetween(time, start, end) {
        return time >= start && time <= end;
    },

    /**
     * Get day name
     */
    getDayName(date = new Date()) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[new Date(date).getDay()];
    },

    /**
     * Calculate estimated wait time based on queue position
     */
    calculateWaitTime(position, avgServiceTime = 15) {
        return position * avgServiceTime;
    },

    /**
     * Play notification sound
     */
    playSound(type = 'notification') {
        if (!CONFIG.notifications.sound) return;

        const audio = new Audio(`assets/sounds/${type}.mp3`);
        audio.play().catch(err => console.log('Sound play failed:', err));
    },

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    /**
     * Show browser notification
     */
    showNotification(title, options = {}) {
        if (!CONFIG.notifications.browser) return;

        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: 'assets/logo.svg',
                badge: 'assets/logo.svg',
                ...options
            });
        }
    },

    /**
     * Speak text using Web Speech API
     */
    speak(text, lang = 'uz-UZ') {
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    },

    /**
     * Generate QR code data URL
     */
    generateQRCode(text, size = 200) {
        if (!text) return '';
        // Using Google Charts API as it's often more stable than qrserver
        return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(text)}&choe=UTF-8`;
    },

    /**
     * Print element
     */
    printElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<link rel="stylesheet" href="css/main.css">');
        printWindow.document.write('</head><body>');
        printWindow.document.write(element.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    },

    /**
     * Get random item from array
     */
    randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Group array by key
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    },

    /**
     * Sort array by key
     */
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            if (order === 'asc') {
                return a[key] > b[key] ? 1 : -1;
            }
            return a[key] < b[key] ? 1 : -1;
        });
    },

    /**
     * Filter array by search term
     */
    filterBySearch(array, searchTerm, keys) {
        const term = searchTerm.toLowerCase();
        return array.filter(item => {
            return keys.some(key => {
                const value = item[key];
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
