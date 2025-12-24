// Operator AI - AI Chatbot
// Intelligent assistant for helping users navigate the queue system

const AIChatbot = {
    // Chat history
    messages: [],
    isOpen: false,

    // Keywords for intent recognition
    intents: {
        greeting: {
            keywords: ['salom', 'hello', 'hi', 'assalomu alaykum', 'привет', 'здравствуйте'],
            responses: {
                uz: 'Assalomu alaykum! Men Operator AI yordamchisiman. Sizga qanday yordam bera olaman?',
                ru: 'Здравствуйте! Я помощник Operator AI. Чем могу вам помочь?',
                en: 'Hello! I\'m Operator AI assistant. How can I help you?'
            }
        },
        queue_status: {
            keywords: ['navbat', 'очередь', 'queue', 'status', 'holat', 'статус', 'raqam', 'номер', 'number'],
            responses: {
                uz: 'Navbat holatini tekshirish uchun raqamingizni kiriting (masalan: A-042)',
                ru: 'Чтобы проверить статус очереди, введите ваш номер (например: A-042)',
                en: 'To check queue status, please enter your number (e.g., A-042)'
            }
        },
        get_ticket: {
            keywords: ['raqam olish', 'получить номер', 'get ticket', 'navbat olish', 'встать в очередь'],
            responses: {
                uz: 'Navbat raqami olish uchun quyidagilarni tanlang:\n1. Tashkilot turini\n2. Filialni\n3. Xizmat turini',
                ru: 'Чтобы получить номер очереди, выберите:\n1. Тип организации\n2. Филиал\n3. Тип услуги',
                en: 'To get a queue number, please select:\n1. Organization type\n2. Branch\n3. Service type'
            }
        },
        bank: {
            keywords: ['bank', 'банк', 'hisob', 'счет', 'account', 'kredit', 'кредит', 'loan', 'karta', 'карта', 'card', 'aloqa'],
            responses: {
                uz: 'Aloqabank xizmatlari:\n• Kredit Bo\'limi\n• Kassa\n• Valyuta Ayirboshlash\n• Plastik Kartalar',
                ru: 'Услуги Aloqabank:\n• Кредитный отдел\n• Касса\n• Обмен валюты\n• Пластиковые карты',
                en: 'Aloqabank Services:\n• Credit Department\n• Cashier\n• Currency Exchange\n• Plastic Cards'
            }
        },
        clinic: {
            keywords: ['klinika', 'клиника', 'clinic', 'shifokor', 'врач', 'doctor', 'tahlil', 'анализ', 'test', 'shifo'],
            responses: {
                uz: 'Shifokor Plus xizmatlari:\n• Terapevt\n• Jarroh\n• Ko\'z Shifokori\n• Laboratoriya',
                ru: 'Услуги Shifokor Plus:\n• Терапевт\n• Хирург\n• Окулист\n• Лаборатория',
                en: 'Shifokor Plus Services:\n• Therapist\n• Surgeon\n• Ophthalmologist\n• Laboratory'
            }
        },
        tax: {
            keywords: ['soliq', 'nalog', 'tax', 'inspeksiya', 'инспекция', 'deklaratsiya', 'декларация'],
            responses: {
                uz: 'Soliq Inspeksiyasi xizmatlari:\n• Jismoniy Shaxslar\n• Yuridik Shaxslar\n• Deklaratsiya\n• Maslahat',
                ru: 'Услуги Налоговой Инспекции:\n• Физ. лица\n• Юр. лица\n• Декларация\n• Консультация',
                en: 'Tax Inspection Services:\n• Individuals\n• Legal Entities\n• Declaration\n• Consultation'
            }
        },
        passport: {
            keywords: ['pasport', 'паспорт', 'passport', 'migratsiya', 'миграция', 'propiska', 'прописка'],
            responses: {
                uz: 'Migratsiya Xizmati:\n• Zagran Pasport\n• ID Karta\n• Propiska\n• Fuqarolik',
                ru: 'Миграционная Служба:\n• Загранпаспорт\n• ID Карта\n• Прописка\n• Гражданство',
                en: 'Migration Service:\n• International Passport\n• ID Card\n• Registration\n• Citizenship'
            }
        },
        wait_time: {
            keywords: ['qancha', 'сколько', 'how long', 'vaqt', 'время', 'time', 'kutish', 'ожидание', 'wait'],
            responses: {
                uz: 'O\'rtacha kutish vaqti:\n• Bank: 10-15 daqiqa\n• Klinika: 20-30 daqiqa\n• Soliq: 15-20 daqiqa\n• Pasport: 20-40 daqiqa',
                ru: 'Среднее время ожидания:\n• Банк: 10-15 минут\n• Клиника: 20-30 минут\n• Налоговая: 15-20 минут\n• Паспорт: 20-40 минут',
                en: 'Average wait time:\n• Bank: 10-15 minutes\n• Clinic: 20-30 minutes\n• Tax: 15-20 minutes\n• Passport: 20-40 minutes'
            }
        },
        help: {
            keywords: ['yordam', 'помощь', 'help', 'qanday', 'как', 'how'],
            responses: {
                uz: 'Men sizga quyidagilar bilan yordam bera olaman:\n\n✓ Navbat raqami olish\n✓ Navbat holatini tekshirish\n✓ Tashkilotlar va xizmatlar haqida ma\'lumot\n\nSavolingizni yozing!',
                ru: 'Я могу помочь вам с:\n\n✓ Получение номера очереди\n✓ Проверка статуса очереди\n✓ Информация об организациях и услугах\n\nЗадайте ваш вопрос!',
                en: 'I can help you with:\n\n✓ Getting a queue number\n✓ Checking queue status\n✓ Information about organizations and services\n\nAsk your question!'
            }
        }
    },

    initialized: false,

    /**
     * Initialize chatbot
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.createChatWidget();
        this.loadChatHistory();
    },

    /**
     * Create chat widget UI
     */
    createChatWidget() {
        // Check if widget already exists
        if (document.getElementById('ai-chatbot')) {
            return;
        }

        const widget = document.createElement('div');
        widget.id = 'ai-chatbot';
        widget.className = 'chatbot-root';
        widget.innerHTML = `
      <button class="chatbot-toggle" id="chat-toggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="chat-badge" id="chat-badge" style="display: none;">1</span>
      </button>
      
      <div class="chatbot-window hidden" id="chat-window">
        <div class="chatbot-header">
          <div class="chatbot-title">
            <div class="chat-avatar">🤖</div>
            <div data-i18n="ai_assistant">AI Assistant</div>
          </div>
          <button class="chat-close" id="chat-close" style="background:none; border:none; color:white; cursor:pointer;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="chatbot-messages" id="chat-messages"></div>
        
        <div class="chatbot-input-area">
          <input 
            type="text" 
            class="chatbot-input" 
            id="chat-input" 
            data-i18n-placeholder="ask_anything"
            placeholder="Type your question..."
          />
          <button class="chatbot-send" id="chat-send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

        const root = document.getElementById('ai-chatbot-root');
        if (root) {
            root.appendChild(widget);
        } else {
            document.body.appendChild(widget);
        }

        // Add event listeners
        document.getElementById('chat-toggle').addEventListener('click', () => this.toggleChat());
        document.getElementById('chat-close').addEventListener('click', () => this.closeChat());
        document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Show welcome message only if history is empty
        if (this.messages.length === 0) {
            this.addMessage('bot', this.getResponse('greeting'));
        }

        this.initDraggable();
    },

    /**
     * Initialize draggable functionality
     */
    initDraggable() {
        const widget = document.getElementById('ai-chatbot');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Load saved position with safety check implies bounds
        try {
            const savedPos = localStorage.getItem('operatorai_chat_pos');
            if (savedPos) {
                const pos = JSON.parse(savedPos);
                // Simple bounds check: if offset is huge, reset.
                if (Math.abs(pos.x) < window.innerWidth && Math.abs(pos.y) < window.innerHeight) {
                    xOffset = pos.x;
                    yOffset = pos.y;
                } else {
                    console.warn('Resetting chatbot position (out of bounds)');
                }
            }
        } catch (e) {
            console.error('Error loading chatbot position', e);
        }

        setTranslate(xOffset, yOffset, widget);

        function dragStart(e) {
            if (e.target.closest('.chatbot-toggle') || e.target.closest('.chatbot-header')) {
                if (e.type === "touchstart") {
                    initialX = e.touches[0].clientX - xOffset;
                    initialY = e.touches[0].clientY - yOffset;
                } else {
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
                }
                isDragging = true;
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            localStorage.setItem('operatorai_chat_pos', JSON.stringify({ x: xOffset, y: yOffset }));
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }
                xOffset = currentX;
                yOffset = currentY;
                setTranslate(currentX, currentY, widget);
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        }

        widget.addEventListener("touchstart", dragStart, false);
        widget.addEventListener("touchend", dragEnd, false);
        widget.addEventListener("touchmove", drag, false);
        widget.addEventListener("mousedown", dragStart, false);
        widget.addEventListener("mouseup", dragEnd, false);
        widget.addEventListener("mousemove", drag, false);
    },

    /**
     * Toggle chat window
     */
    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chat-window');
        const chatBadge = document.getElementById('chat-badge');

        if (this.isOpen) {
            chatWindow.classList.remove('hidden');
            chatBadge.style.display = 'none';
            document.getElementById('chat-input').focus();
        } else {
            chatWindow.classList.add('hidden');
        }
    },

    /**
     * Close chat window
     */
    closeChat() {
        this.isOpen = false;
        document.getElementById('chat-window').classList.add('hidden');
    },

    /**
     * Send message
     */
    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        input.value = '';

        this.processMessage(message);
    },

    /**
     * Add message to chat
     */
    addMessage(sender, text) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageId = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 9);
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `message ${sender === 'bot' ? 'message-ai' : 'message-user'}`;
        messageDiv.innerHTML = Utils.sanitizeHTML(text).replace(/\n/g, '<br>');

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ sender, text, time: new Date().toISOString() });
        this.saveChatHistory();

        if (!this.isOpen && sender === 'bot') {
            const badge = document.getElementById('chat-badge');
            if (badge) badge.style.display = 'flex';
        }

        return messageId;
    },

    /**
     * Process user message and generate response
     */
    /**
     * Process user message via API
     */
    async processMessage(message) {
        // Show typing indicator or placeholder
        const loadingId = this.addMessage('bot', '<span class="typing-indicator">...</span>');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            // Remove loading message
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            // Show real response
            if (data.response) {
                this.addMessage('bot', data.response);
            } else {
                this.addMessage('bot', 'Uzr, xatolik yuz berdi.');
            }

        } catch (error) {
            console.error('Chat API Error:', error);
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();
            this.addMessage('bot', 'Uzr, server bilan bog\'lanishda xatolik.');
        }
    },

    /**
     * Get response based on intent and current language
     */
    getResponse(intent) {
        const lang = Language.getLanguage();
        const intentData = this.intents[intent];
        return (intentData && intentData.responses[lang]) ? intentData.responses[lang] : this.intents.help.responses[lang];
    },

    /**
     * Get queue status by number
     */
    getQueueStatus(queueNumber) {
        const queue = Database.getQueueByNumber(queueNumber);
        const lang = Language.getLanguage();

        if (!queue) {
            const responses = {
                uz: `Navbat raqami ${queueNumber} topilmadi. Iltimos, raqamni tekshiring.`,
                ru: `Номер очереди ${queueNumber} не найден. Пожалуйста, проверьте номер.`,
                en: `Queue number ${queueNumber} not found. Please check the number.`
            };
            return responses[lang];
        }

        const branch = Database.getBranch(queue.branchId);
        const service = Database.getService(queue.serviceId);
        const staff = queue.staffId ? Database.getStaffMember(queue.staffId) : null;

        let statusText = '';
        if (lang === 'uz') {
            statusText = `📋 Navbat: ${queueNumber}\n🏢 Filial: ${branch.name}\n📌 Xizmat: ${service.name}\n📊 Holat: ${this.getStatusText(queue.status, lang)}\n`;
            if (queue.status === 'waiting') {
                const position = QueueManager.getQueuePosition(queue.id);
                statusText += `👥 Sizdan oldin: ${position.position - 1} kishi\n⏱ Taxminiy kutish: ${position.estimatedWaitTime} daqiqa`;
            } else if (queue.status === 'called' || queue.status === 'serving') {
                statusText += `🎯 ${staff?.counter || 'Counter'}ga tashrif buyuring`;
            } else if (queue.status === 'completed') {
                statusText += `✅ Xizmat ko'rsatildi`;
            }
        } else if (lang === 'ru') {
            statusText = `📋 Очередь: ${queueNumber}\n🏢 Филиал: ${branch.name}\n📌 Услуга: ${service.nameRu}\n📊 Статус: ${this.getStatusText(queue.status, lang)}\n`;
            if (queue.status === 'waiting') {
                const position = QueueManager.getQueuePosition(queue.id);
                statusText += `👥 Перед вами: ${position.position - 1} человек\n⏱ Примерное ожидание: ${position.estimatedWaitTime} минут`;
            } else if (queue.status === 'called' || queue.status === 'serving') {
                statusText += `🎯 Пройдите к ${staff?.counter || 'Counter'}`;
            } else if (queue.status === 'completed') {
                statusText += `✅ Обслужено`;
            }
        } else {
            statusText = `📋 Queue: ${queueNumber}\n🏢 Branch: ${branch.name}\n📌 Service: ${service.nameEn}\n📊 Status: ${this.getStatusText(queue.status, lang)}\n`;
            if (queue.status === 'waiting') {
                const position = QueueManager.getQueuePosition(queue.id);
                statusText += `👥 People ahead: ${position.position - 1}\n⏱ Estimated wait: ${position.estimatedWaitTime} minutes`;
            } else if (queue.status === 'called' || queue.status === 'serving') {
                statusText += `🎯 Please proceed to ${staff?.counter || 'Counter'}`;
            } else if (queue.status === 'completed') {
                statusText += `✅ Completed`;
            }
        }
        return statusText;
    },

    /**
     * Get status text in current language
     */
    getStatusText(status, lang) {
        const statusTexts = {
            waiting: { uz: 'Kutmoqda', ru: 'Ожидание', en: 'Waiting' },
            called: { uz: 'Chaqirildi', ru: 'Вызван', en: 'Called' },
            serving: { uz: 'Xizmat ko\'rsatilmoqda', ru: 'Обслуживается', en: 'Serving' },
            completed: { uz: 'Bajarildi', ru: 'Выполнено', en: 'Completed' },
            cancelled: { uz: 'Bekor qilindi', ru: 'Отменено', en: 'Cancelled' },
            'no-show': { uz: 'Kelmadi', ru: 'Не пришел', en: 'No Show' }
        };
        return statusTexts[status]?.[lang] || status;
    },

    /**
     * Save chat history to localStorage
     */
    saveChatHistory() {
        localStorage.setItem('operatorai_chat_history', JSON.stringify(this.messages));
    },

    /**
     * Load chat history from localStorage
     */
    loadChatHistory() {
        const history = localStorage.getItem('operatorai_chat_history');
        if (history) {
            try {
                this.messages = JSON.parse(history);
                const recentMessages = this.messages.slice(-10);
                const messagesContainer = document.getElementById('chat-messages');
                if (messagesContainer) {
                    recentMessages.forEach(msg => {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `message ${msg.sender === 'bot' ? 'message-ai' : 'message-user'}`;
                        messageDiv.innerHTML = Utils.sanitizeHTML(msg.text).replace(/\n/g, '<br>');
                        messagesContainer.appendChild(messageDiv);
                    });
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        }
    },

    /**
     * Clear chat history
     */
    clearHistory() {
        this.messages = [];
        localStorage.removeItem('operatorai_chat_history');
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) messagesContainer.innerHTML = '';
        this.addMessage('bot', this.getResponse('greeting'));
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIChatbot.init());
} else {
    AIChatbot.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChatbot;
}
