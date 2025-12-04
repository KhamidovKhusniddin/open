// Simplified AI Chatbot with Hugging Face Integration
const AIChatbot = {
    // Hugging Face Configuration (BEPUL!)
    HF_API_KEY: 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Hugging Face API key
    HF_API_URL: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    // Alternative models:
    // 'meta-llama/Llama-2-7b-chat-hf'
    // 'google/flan-t5-large'
    // 'tiiuae/falcon-7b-instruct'

    isOpen: false,
    messages: [],
    conversationHistory: [],

    init() {
        console.log('🤖 Initializing chatbot...');
        this.createChatWidget();
        this.addMessage('bot', 'Salom! Men Operator AI. Sizga qanday yordam bera olaman?');
        console.log('✅ Chatbot initialized successfully');
    },

    createChatWidget() {
        if (document.getElementById('ai-chatbot')) return;

        const widget = document.createElement('div');
        widget.id = 'ai-chatbot';
        widget.className = 'ai-chatbot';
        widget.innerHTML = `
            <button class="chat-toggle" id="chat-toggle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
            
            <div class="chat-window" id="chat-window" style="display: none;">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar">🤖</div>
                        <div>
                            <div class="chat-title">Operator AI</div>
                            <div class="chat-status">Online</div>
                        </div>
                    </div>
                    <button class="chat-close" id="chat-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div class="chat-messages" id="chat-messages"></div>
                
                <div class="chat-input-container">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Savolingizni yozing..." />
                    <button class="chat-send" id="chat-send">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Event listeners
        document.getElementById('chat-close').addEventListener('click', () => this.closeChat());
        document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Make chatbot draggable
        this.makeDraggable();
    },

    makeDraggable() {
        const chatbot = document.getElementById('ai-chatbot');
        const toggle = document.getElementById('chat-toggle');
        let isDragging = false;
        let hasMoved = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Mouse events for desktop
        toggle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Touch events for mobile
        toggle.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', dragEnd);

        // Prevent click if dragged
        toggle.addEventListener('click', (e) => {
            if (hasMoved) {
                e.stopPropagation();
                e.preventDefault();
                hasMoved = false;
            } else {
                this.toggleChat();
            }
        });

        function dragStart(e) {
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            isDragging = true;
            hasMoved = false;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                if (e.type === 'touchmove') {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;
                hasMoved = true;

                setTranslate(currentX, currentY, chatbot);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    },

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chat-window');
        if (this.isOpen) {
            chatWindow.style.display = 'flex';
            document.getElementById('chat-input').focus();
        } else {
            chatWindow.style.display = 'none';
        }
    },

    closeChat() {
        this.isOpen = false;
        document.getElementById('chat-window').style.display = 'none';
    },

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Call OpenAI API
            const response = await this.callOpenAI(message);
            this.hideTypingIndicator();
            this.addMessage('bot', response);
        } catch (error) {
            console.error('OpenAI Error:', error);
            this.hideTypingIndicator();
            // Fallback response
            this.addMessage('bot', 'Kechirasiz, xatolik yuz berdi. Navbat olish uchun "Boshlash" tugmasini bosing.');
        }
    },

    async callOpenAI(userMessage) {
        // Build conversation context
        const systemPrompt = `Siz Operator AI - O'zbekistondagi navbat boshqaruv tizimining yordamchisisiz. 
Siz do'stona, professional va foydali javoblar berasiz. 
Foydalanuvchilarga navbat olish, tashkilotlar va xizmatlar haqida ma'lumot berasiz.
Har doim qisqa va aniq javob bering (2-3 jumla).
O'zbek tilida javob bering.
Iloji boricha togri javob bering
To'gri javob bering  `;

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        // Prepare messages for API
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory.slice(-10) // Last 10 messages for context
        ];

        const response = await fetch(this.OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: this.OPENAI_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Add AI response to history
        const response = await this.callOpenAI(message);
        this.hideTypingIndicator();
        this.addMessage('bot', response);
    } catch(error) {
        console.error('OpenAI Error:', error);
        this.hideTypingIndicator();
        // Fallback response
        this.addMessage('bot', 'Kechirasiz, xatolik yuz berdi. Navbat olish uchun "Boshlash" tugmasini bosing.');
    }
},

    async callOpenAI(userMessage) {
        // Build conversation prompt for Hugging Face
        const systemPrompt = `Siz OPERATOR AI - O'zbekistonning birinchi sun'iy intellekt asosidagi navbat boshqaruv yordamchisisiz.

KIM SIZIZ:
- Nomi: Operator AI
- Vazifa: Navbat tizimida foydalanuvchilarga yordam berish
- Til: O'zbek tili (asosiy), Rus va Ingliz tillarida ham gaplasha olasiz
- Xususiyat: Do'stona, professional, samarali

NIMA QILA OLASIZ:
1. Navbat olishda yordam berish
2. Tashkilotlar va filiallar haqida ma'lumot berish
3. Xizmatlar ro'yxati va tavsifini ko'rsatish
4. Navbat holati va kutish vaqti haqida ma'lumot berish
5. Kerakli hujjatlar ro'yxatini aytish
6. Ish vaqtlari va manzillar haqida ma'lumot berish
7. Tizimdan foydalanish bo'yicha yo'riqnoma berish

QANDAY JAVOB BERASIZ:
- Qisqa va aniq (2-3 jumla)
- Do'stona va samimiy ohangda
- Emoji ishlatib, qiziqarli qiling 😊
- Har doim yordam taklif qiling
- Agar bilmasangiz, halol aytib, boshqa yo'l ko'rsating

MUHIM QOIDALAR:
- Faqat navbat tizimi bilan bog'liq savollarga javob bering
- Agar savol boshqa mavzuda bo'lsa, iltimos bilan navbat tizimiga qaytaring
- Hech qachon yolg'on ma'lumot bermang
- Agar aniq javob bilmasangiz, "Aniq ma'lumot yo'q" deb aytib, qo'llab-quvvatlash xizmatiga murojaat qilishni tavsiya qiling

MISOL JAVOBLAR:
Savol: "Salom, kim siz?"
Javob: "Salom! 👋 Men Operator AI - navbat tizimining yordamchisiman. Sizga navbat olish, tashkilotlar va xizmatlar haqida ma'lumot berishda yordam bera olaman. Nima kerak?"

Savol: "Qanday xizmatlar bor?"
Javob: "Bizda klinikalar, banklar, soliq xizmatlari va pasport bo'limlari mavjud. 🏥🏦 Qaysi birida navbat olmoqchisiz?"

Endi foydalanuvchi savoliga javob bering:`;

        // Build conversation history
        let conversationText = systemPrompt + '\n\n';

        // Add last 5 messages for context
        const recentMessages = this.conversationHistory.slice(-5);
        recentMessages.forEach(msg => {
            conversationText += `${msg.role === 'user' ? 'Foydalanuvchi' : 'Operator AI'}: ${msg.content}\n`;
        });

        conversationText += `Foydalanuvchi: ${userMessage}\nOperator AI:`;

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        const response = await fetch(this.HF_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.HF_API_KEY}`
            },
            body: JSON.stringify({
                inputs: conversationText,
                parameters: {
                    max_new_tokens: 150,
                    temperature: 0.7,
                    top_p: 0.9,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let aiResponse = '';

        if (Array.isArray(data) && data[0]?.generated_text) {
            aiResponse = data[0].generated_text.trim();
        } else if (data.generated_text) {
            aiResponse = data.generated_text.trim();
        } else {
            throw new Error('Unexpected response format from Hugging Face');
        }

        // Clean up response
        aiResponse = aiResponse.replace(/^Operator AI:\s*/i, '').trim();

        // Add AI response to history
        this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });

        return aiResponse;
    },

        showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'chat-message bot-message';
    div.innerHTML = `
            <div class="message-content">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
},

hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
},

addMessage(sender, text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-message ${sender}-message`;

    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
            <div class="message-content">${text.replace(/\n/g, '<br>')}</div>
            <div class="message-time">${time}</div>
        `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    this.messages.push({ sender, text, time: new Date().toISOString() });
}
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIChatbot.init());
} else {
    AIChatbot.init();
}
