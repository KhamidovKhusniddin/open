// Theme Management Logic
const ThemeManager = {
    theme: localStorage.getItem('operatorai_theme') || 'light',

    init() {
        // Apply saved theme or system preference
        if (!localStorage.getItem('operatorai_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.theme = 'dark';
        }

        this.applyTheme();
        this.createToggle();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('operatorai_theme', this.theme);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: this.theme } }));
    },

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.updateToggleButton();
    },

    createToggle() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('data-i18n-title', 'toggle_theme');
        toggleBtn.innerHTML = this.getIcon();

        toggleBtn.addEventListener('click', () => this.toggleTheme());

        // Insert before language switcher or as first action
        const langSwitcher = navActions.querySelector('.language-switcher');
        if (langSwitcher) {
            navActions.insertBefore(toggleBtn, langSwitcher);
        } else {
            navActions.prepend(toggleBtn);
        }
    },

    getIcon() {
        return this.theme === 'light'
            ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
            : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>`;
    },

    updateToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.getIcon();
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
