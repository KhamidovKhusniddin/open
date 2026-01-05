// Operator AI - Multi-language Support
// Handles translations and language switching

const Language = {
    currentLang: localStorage.getItem('operatorai_language') || 'uz',

    translations: {
        uz: {
            // Common
            'app_name': 'Operator AI',
            'welcome': 'Xush kelibsiz',
            'loading': 'Yuklanmoqda...',
            'save': 'Saqlash',
            'cancel': 'Bekor qilish',
            'delete': 'O\'chirish',
            'edit': 'Tahrirlash',
            'add': 'Qo\'shish',
            'search': 'Qidirish',
            'filter': 'Filtrlash',
            'export': 'Eksport',
            'print': 'Chop etish',
            'close': 'Yopish',
            'back': 'Orqaga',
            'next': 'Keyingi',
            'previous': 'Oldingi',
            'submit': 'Yuborish',
            'confirm': 'Tasdiqlash',
            'toggle_theme': 'Mavzuni almashtirish',
            'yes': 'Ha',
            'no': 'Yo\'q',

            // Navigation
            'home': 'Bosh sahifa',
            'queue': 'Navbat',
            'admin': 'Administrator',
            'staff': 'Xodim',
            'display': 'Ekran',
            'login': 'Kirish',
            'logout': 'Chiqish',
            'profile': 'Profil',
            'settings': 'Sozlamalar',

            // Landing Page
            'hero_title': 'Navbatlarni boshqarishning eng zamonaviy tizimi',
            'hero_subtitle': 'AI texnologiyasi bilan vaqtingizni tejang va xizmat sifatini oshiring',
            'ai_powered': 'AI-Powered Tizim',
            'total_visitors': 'Jami tashrifchilar',
            'partners': 'Hamkorlar',
            'accuracy': 'Aniq bashorat',
            'queue_status': 'Navbat holati',
            'get_started': 'Boshlash',
            'start_now': 'Hozir boshlash',
            'learn_more': 'Batafsil',
            'features': 'Imkoniyatlar',
            'how_it_works': 'Qanday ishlaydi',
            'pricing': 'Narxlar',
            'contact': 'Aloqa',

            // Features
            'feature_ai_title': 'AI Yordamchi',
            'feature_ai_desc': 'Sun\'iy intellekt yordamida avtomatik xizmat tavsiyasi',
            'feature_realtime_title': 'Real-time yangilanish',
            'feature_realtime_desc': 'Navbat holati darhol yangilanadi',
            'feature_analytics_title': 'Tahlil va hisobotlar',
            'feature_analytics_desc': 'To\'liq statistika va analitika',
            'feature_multilang_title': 'Ko\'p tillilik',
            'feature_multilang_desc': 'O\'zbek, Rus va Ingliz tillarida',

            // Queue Interface
            'get_ticket': 'Raqam olish',
            'select_organization': 'Tashkilotni tanlang',
            'select_branch': 'Filialni tanlang',
            'select_service': 'Xizmatni tanlang',
            'your_number': 'Sizning raqamingiz',
            'queue_position': 'Navbatdagi o\'rningiz',
            'estimated_wait': 'Taxminiy kutish vaqti',
            'people_ahead': 'Sizdan oldin',
            'current_serving': 'Hozir xizmat ko\'rsatilmoqda',
            'your_turn_soon': 'Sizning navbatingiz yaqinlashmoqda',
            'please_wait': 'Iltimos, kuting',

            // Admin Dashboard
            'dashboard': 'Boshqaruv paneli',
            'overview': 'Umumiy ko\'rinish',
            'organizations': 'Tashkilotlar',
            'branches': 'Filiallar',
            'services': 'Xizmatlar',
            'staff_management': 'Xodimlar',
            'queue_management': 'Navbatlar',
            'analytics': 'Analitika',
            'reports': 'Hisobotlar',
            'total_queues': 'Jami navbatlar',
            'active_queues': 'Faol navbatlar',
            'completed_today': 'Bugun bajarildi',
            'average_wait_time': 'O\'rtacha kutish vaqti',
            'average_service_time': 'O\'rtacha xizmat vaqti',

            // Staff Panel
            'call_next': 'Keyingisini chaqirish',
            'current_customer': 'Joriy mijoz',
            'mark_completed': 'Bajarildi deb belgilash',
            'mark_no_show': 'Kelmadi',
            'transfer': 'Boshqa bo\'limga o\'tkazish',
            'add_note': 'Izoh qo\'shish',
            'pause_service': 'Xizmatni to\'xtatish',
            'resume_service': 'Xizmatni davom ettirish',
            'today_stats': 'Bugungi statistika',
            'served_today': 'Bugun xizmat ko\'rsatildi',
            'no_current_queue': 'Hozirda navbat yo\'q',
            'patient_history': 'Bemorg tashxislar tarixi',
            'notes_placeholder': 'Tibbiy izoh yoki tashxis...',
            'transfer_to': 'Yo\'naltirish:',

            // Display Screen
            'now_serving': 'HOZIR XIZMAT KO\'RSATILMOQDA',
            'waiting': 'Kutmoqda',
            'counter': 'Peshtaxta',
            'room': 'Xona',

            // Status
            'status_waiting': 'Kutmoqda',
            'status_called': 'Chaqirildi',
            'status_serving': 'Xizmat ko\'rsatilmoqda',
            'status_completed': 'Bajarildi',
            'status_cancelled': 'Bekor qilindi',
            'status_no_show': 'Kelmadi',

            // Organization Types
            'org_bank': 'Bank',
            'org_clinic': 'Klinika',
            'org_government': 'Davlat xizmati',
            'org_passport': 'Pasport xizmati',
            'org_tax': 'Soliq xizmati',

            // Messages
            'success_saved': 'Muvaffaqiyatli saqlandi',
            'success_deleted': 'Muvaffaqiyatli o\'chirildi',
            'success_updated': 'Muvaffaqiyatli yangilandi',
            'error_occurred': 'Xatolik yuz berdi',
            'confirm_delete': 'Rostdan ham o\'chirmoqchimisiz?',
            'no_data': 'Ma\'lumot yo\'q',
            'required_field': 'Majburiy maydon',

            // AI Chatbot
            'ai_assistant': 'AI Yordamchi',
            'ask_anything': 'Savolingizni yozing...',
            'ai_greeting': 'Salom! Men sizga qanday yordam bera olaman?',
            'ai_help_queue': 'Navbat olish uchun xizmat turini tanlang',
            'ai_help_status': 'Navbat holatini tekshirish uchun raqamingizni kiriting',

            // Tracker Page
            'tracker_title': 'Navbatni jonli kuzatish',
            'tracker_subtitle': 'O\'z o\'rningizni real vaqtda kuzatib boring',
            'arrival_time': 'Taxminiy yetib kelish',
            'wait_time': 'Kutish vaqti',
            'real_time_updates': 'Jonli yangilanishlar',
            'enter_email': 'Emailingizni kiriting',
            'notify_me': 'Email orqali ogohlantirish',
            'back_home': 'Bosh sahifaga qaytish',
            'your_turn_has_come': 'Sizning navbatingiz keldi',
            'proceed_to_counter': 'Iltimos, darchaga yaqinlashing',
            'tracker_admin_msg': 'Siz tanlagan brendga mos ravishda barcha ma\'lumotlarni ko\'rishingiz mumkin.',
            'minutes': 'daqiqa',
            'last_updated_at': 'Oxirgi yangilanish'
        },

        ru: {
            // Common
            'app_name': 'Operator AI',
            'welcome': 'Добро пожаловать',
            'loading': 'Загрузка...',
            'save': 'Сохранить',
            'cancel': 'Отмена',
            'delete': 'Удалить',
            'edit': 'Редактировать',
            'add': 'Добавить',
            'search': 'Поиск',
            'filter': 'Фильтр',
            'export': 'Экспорт',
            'print': 'Печать',
            'close': 'Закрыть',
            'back': 'Назад',
            'next': 'Далее',
            'previous': 'Предыдущий',
            'submit': 'Отправить',
            'confirm': 'Подтвердить',
            'toggle_theme': 'Сменить тему',
            'yes': 'Да',
            'no': 'Нет',

            // Navigation
            'home': 'Главная',
            'queue': 'Очередь',
            'admin': 'Администратор',
            'staff': 'Сотрудник',
            'display': 'Экран',
            'login': 'Вход',
            'logout': 'Выход',
            'profile': 'Профиль',
            'settings': 'Настройки',

            // Landing Page
            'hero_title': 'Самая современная система управления очередями',
            'hero_subtitle': 'Экономьте время и повышайте качество обслуживания с технологией AI',
            'ai_powered': 'Система на базе AI',
            'total_visitors': 'Всего посетителей',
            'partners': 'Партнеры',
            'accuracy': 'Точный прогноз',
            'queue_status': 'Статус очереди',
            'get_started': 'Начать',
            'start_now': 'Начать сейчас',
            'learn_more': 'Подробнее',
            'features': 'Возможности',
            'how_it_works': 'Как это работает',
            'pricing': 'Цены',
            'contact': 'Контакты',

            // Features
            'feature_ai_title': 'AI Помощник',
            'feature_ai_desc': 'Автоматические рекомендации услуг с искусственным интеллектом',
            'feature_realtime_title': 'Обновление в реальном времени',
            'feature_realtime_desc': 'Статус очереди обновляется мгновенно',
            'feature_analytics_title': 'Анализ и отчеты',
            'feature_analytics_desc': 'Полная статистика и аналитика',
            'feature_multilang_title': 'Многоязычность',
            'feature_multilang_desc': 'На узбекском, русском и английском языках',

            // Queue Interface
            'get_ticket': 'Получить номер',
            'select_organization': 'Выберите организацию',
            'select_branch': 'Выберите филиал',
            'select_service': 'Выберите услугу',
            'your_number': 'Ваш номер',
            'queue_position': 'Ваше место в очереди',
            'estimated_wait': 'Примерное время ожидания',
            'people_ahead': 'Перед вами',
            'current_serving': 'Сейчас обслуживается',
            'your_turn_soon': 'Ваша очередь приближается',
            'please_wait': 'Пожалуйста, подождите',

            // Admin Dashboard
            'dashboard': 'Панель управления',
            'overview': 'Обзор',
            'organizations': 'Организации',
            'branches': 'Филиалы',
            'services': 'Услуги',
            'staff_management': 'Сотрудники',
            'queue_management': 'Очереди',
            'analytics': 'Аналитика',
            'reports': 'Отчеты',
            'total_queues': 'Всего очередей',
            'active_queues': 'Активные очереди',
            'completed_today': 'Выполнено сегодня',
            'average_wait_time': 'Среднее время ожидания',
            'average_service_time': 'Среднее время обслуживания',

            // Staff Panel
            'call_next': 'Вызвать следующего',
            'current_customer': 'Текущий клиент',
            'mark_completed': 'Отметить как выполненное',
            'mark_no_show': 'Не пришел',
            'transfer': 'Перевести в другой отдел',
            'add_note': 'Добавить заметку',
            'pause_service': 'Приостановить обслуживание',
            'resume_service': 'Возобновить обслуживание',
            'today_stats': 'Статистика за сегодня',
            'served_today': 'Обслужено сегодня',

            // Display Screen
            'now_serving': 'СЕЙЧАС ОБСЛУЖИВАЕТСЯ',
            'waiting': 'Ожидание',
            'counter': 'Окно',
            'room': 'Кабинет',

            // Status
            'status_waiting': 'Ожидание',
            'status_called': 'Вызван',
            'status_serving': 'Обслуживается',
            'status_completed': 'Выполнено',
            'status_cancelled': 'Отменено',
            'status_no_show': 'Не пришел',

            // Organization Types
            'org_bank': 'Банк',
            'org_clinic': 'Клиника',
            'org_government': 'Государственная служба',
            'org_passport': 'Паспортная служба',
            'org_tax': 'Налоговая служба',

            // Messages
            'success_saved': 'Успешно сохранено',
            'success_deleted': 'Успешно удалено',
            'success_updated': 'Успешно обновлено',
            'error_occurred': 'Произошла ошибка',
            'confirm_delete': 'Вы действительно хотите удалить?',
            'no_data': 'Нет данных',
            'required_field': 'Обязательное поле',

            // AI Chatbot
            'ai_assistant': 'AI Помощник',
            'ask_anything': 'Напишите ваш вопрос...',
            'ai_greeting': 'Здравствуйте! Чем я могу вам помочь?',
            'ai_help_queue': 'Выберите тип услуги для получения номера',
            'ai_help_status': 'Введите ваш номер для проверки статуса очереди',

            // Tracker Page
            'tracker_title': 'Живое отслеживание очереди',
            'tracker_subtitle': 'Следите за своим местом в реальном времени',
            'arrival_time': 'Ожидаемое прибытие',
            'wait_time': 'Время ожидания',
            'real_time_updates': 'Живые обновления',
            'enter_email': 'Введите email',
            'notify_me': 'Уведомить по email',
            'back_home': 'На главную',
            'your_turn_has_come': 'Ваша очередь подошла',
            'proceed_to_counter': 'Пожалуйста, пройдите к окну',
            'tracker_admin_msg': 'Все данные можно настроить в соответствии с вашим брендом.',
            'minutes': 'минут',
            'last_updated_at': 'Последнее обновление'
        },

        en: {
            // Common
            'app_name': 'Operator AI',
            'welcome': 'Welcome',
            'loading': 'Loading...',
            'save': 'Save',
            'cancel': 'Cancel',
            'delete': 'Delete',
            'edit': 'Edit',
            'add': 'Add',
            'search': 'Search',
            'filter': 'Filter',
            'export': 'Export',
            'print': 'Print',
            'close': 'Close',
            'back': 'Back',
            'next': 'Next',
            'previous': 'Previous',
            'submit': 'Submit',
            'confirm': 'Confirm',
            'toggle_theme': 'Toggle Theme',
            'yes': 'Yes',
            'no': 'No',

            // Navigation
            'home': 'Home',
            'queue': 'Queue',
            'admin': 'Admin',
            'staff': 'Staff',
            'display': 'Display',
            'login': 'Login',
            'logout': 'Logout',
            'profile': 'Profile',
            'settings': 'Settings',

            // Landing Page
            'hero_title': 'The Most Modern Queue Management System',
            'hero_subtitle': 'Save time and improve service quality with AI technology',
            'ai_powered': 'AI-Powered System',
            'total_visitors': 'Total Visitors',
            'partners': 'Partners',
            'accuracy': 'Accuracy',
            'queue_status': 'Queue Status',
            'get_started': 'Get Started',
            'start_now': 'Start Now',
            'learn_more': 'Learn More',
            'features': 'Features',
            'how_it_works': 'How It Works',
            'pricing': 'Pricing',
            'contact': 'Contact',

            // Features
            'feature_ai_title': 'AI Assistant',
            'feature_ai_desc': 'Automatic service recommendations with artificial intelligence',
            'feature_realtime_title': 'Real-time Updates',
            'feature_realtime_desc': 'Queue status updates instantly',
            'feature_analytics_title': 'Analytics & Reports',
            'feature_analytics_desc': 'Complete statistics and analytics',
            'feature_multilang_title': 'Multi-language',
            'feature_multilang_desc': 'In Uzbek, Russian and English',

            // Queue Interface
            'get_ticket': 'Get Ticket',
            'select_organization': 'Select Organization',
            'select_branch': 'Select Branch',
            'select_service': 'Select Service',
            'your_number': 'Your Number',
            'queue_position': 'Your Position',
            'estimated_wait': 'Estimated Wait Time',
            'people_ahead': 'People Ahead',
            'current_serving': 'Now Serving',
            'your_turn_soon': 'Your turn is coming soon',
            'please_wait': 'Please wait',

            // Admin Dashboard
            'dashboard': 'Dashboard',
            'overview': 'Overview',
            'organizations': 'Organizations',
            'branches': 'Branches',
            'services': 'Services',
            'staff_management': 'Staff',
            'queue_management': 'Queues',
            'analytics': 'Analytics',
            'reports': 'Reports',
            'total_queues': 'Total Queues',
            'active_queues': 'Active Queues',
            'completed_today': 'Completed Today',
            'average_wait_time': 'Average Wait Time',
            'average_service_time': 'Average Service Time',

            // Staff Panel
            'call_next': 'Call Next',
            'current_customer': 'Current Customer',
            'mark_completed': 'Mark as Completed',
            'mark_no_show': 'No Show',
            'transfer': 'Transfer to Another Department',
            'add_note': 'Add Note',
            'pause_service': 'Pause Service',
            'resume_service': 'Resume Service',
            'today_stats': 'Today\'s Statistics',
            'served_today': 'Served Today',

            // Display Screen
            'now_serving': 'NOW SERVING',
            'waiting': 'Waiting',
            'counter': 'Counter',
            'room': 'Room',

            // Status
            'status_waiting': 'Waiting',
            'status_called': 'Called',
            'status_serving': 'Serving',
            'status_completed': 'Completed',
            'status_cancelled': 'Cancelled',
            'status_no_show': 'No Show',

            // Organization Types
            'org_bank': 'Bank',
            'org_clinic': 'Clinic',
            'org_government': 'Government Service',
            'org_passport': 'Passport Service',
            'org_tax': 'Tax Service',

            // Messages
            'success_saved': 'Successfully saved',
            'success_deleted': 'Successfully deleted',
            'success_updated': 'Successfully updated',
            'error_occurred': 'An error occurred',
            'confirm_delete': 'Are you sure you want to delete?',
            'no_data': 'No data',
            'required_field': 'Required field',

            // AI Chatbot
            'ai_assistant': 'AI Assistant',
            'ask_anything': 'Type your question...',
            'ai_greeting': 'Hello! How can I help you?',
            'ai_help_queue': 'Select service type to get a ticket',
            'ai_help_status': 'Enter your number to check queue status',

            // Tracker Page
            'tracker_title': 'Live Queue Tracker',
            'tracker_subtitle': 'Track your position in real-time',
            'arrival_time': 'Expected Arrival',
            'wait_time': 'Estimated Wait',
            'real_time_updates': 'Real-time Updates',
            'enter_email': 'Enter email',
            'notify_me': 'Notify me by email',
            'back_home': 'Back to Home',
            'your_turn_has_come': 'Your turn has come',
            'proceed_to_counter': 'Please proceed to the counter',
            'tracker_admin_msg': 'Everything you see here can be customized to match your brand.',
            'minutes': 'minutes',
            'last_updated_at': 'Last Updated'
        }
    },

    /**
     * Get translation for key
     */
    t(key) {
        return this.translations[this.currentLang][key] || key;
    },

    /**
     * Set current language
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('operatorai_language', lang);
            this.updatePageLanguage();
            return true;
        }
        return false;
    },

    /**
     * Get current language
     */
    getLanguage() {
        return this.currentLang;
    },

    /**
     * Update all elements with data-i18n attribute
     */
    updatePageLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Dispatch language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLang }
        }));
    },

    /**
     * Initialize language system
     */
    init() {
        // Set initial language
        const savedLang = localStorage.getItem('operatorai_language');
        if (savedLang && this.translations[savedLang]) {
            this.currentLang = savedLang;
        }

        // Update page when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updatePageLanguage());
        } else {
            this.updatePageLanguage();
        }

        // Create language switcher if it doesn't exist
        this.createLanguageSwitcher();
    },

    /**
     * Create language switcher UI
     */
    createLanguageSwitcher() {
        const switchers = document.querySelectorAll('.language-switcher');

        switchers.forEach(container => {
            container.innerHTML = CONFIG.languages.map(lang => `
        <button 
          class="lang-btn ${lang.code === this.currentLang ? 'active' : ''}" 
          data-lang="${lang.code}"
          title="${lang.name}"
        >
          <span class="lang-flag">${lang.flag}</span>
          <span class="lang-code">${lang.code.toUpperCase()}</span>
        </button>
      `).join('');

            // Add click handlers
            container.querySelectorAll('.lang-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const lang = btn.getAttribute('data-lang');
                    this.setLanguage(lang);

                    // Update active state
                    container.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
        });
    }
};

// Auto-initialize
Language.init();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Language;
}
