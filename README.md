# 🤖 Operator AI - Navbat Boshqaruv Tizimi

Zamonaviy navbat boshqaruv tizimi - Telegram bot, real-time kuzatuv, AI yo'naltirish va reyting tizimi bilan.

## 🚀 Xususiyatlar

### ✅ Asosiy funksiyalar
- 📱 **Telegram Bot Integratsiyasi** - Avtomatik tasdiqlash va xabarnomalar
- 🎫 **Navbat Boshqaruvi** - Real-time navbat yaratish va kuzatish
- ⏰ **Smart Bashorat** - Kutish vaqtini hisoblash va ko'rsatish
- 📊 **Admin Panel** - To'liq statistika va boshqaruv
- 👨‍⚕️ **Xodimlar Paneli** - Navbatlarni chaqirish va boshqarish
- ⭐ **Reyting Tizimi** - Xizmat sifatini baholash
- 🔄 **Yo'naltirish** - Bemorlarni boshqa bo'limlarga o'tkazish
- 🎨 **Premium Dizayn** - Glassmorphism va zamonaviy UI/UX

### 🔐 Xavfsizlik
- JWT autentifikatsiya
- Role-based access control (RBAC)
- Telefon raqami orqali tasdiqlash
- Bir vaqtda bitta xodimga bitta bemor

## 📋 Talablar

- Python 3.9+
- SQLite
- Telegram Bot Token
- Google Gemini API Key (ixtiyoriy)

## 🛠 O'rnatish (Lokal)

1. **Repository'ni klonlash:**
```bash
git clone <your-repo-url>
cd queue-manager
```

2. **Virtual environment yaratish:**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **Kerakli kutubxonalarni o'rnatish:**
```bash
pip install -r requirements.txt
```

4. **`.env` faylini yaratish:**
```bash
cp .env.example .env
```

5. **`.env` faylini to'ldirish:**
```env
BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=your_secret_key_here
ADMIN_PHONE=+998901234567
ADMIN_PASSWORD=your_admin_password
```

6. **Ishga tushirish:**
```bash
python app.py
```

Server `http://localhost:5000` da ishga tushadi.

## 🌐 Render.com'ga Deploy Qilish

### 1. GitHub'ga Push Qilish

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Render.com'da Sozlash

1. [Render.com](https://render.com) ga kiring
2. **New +** → **Web Service** ni tanlang
3. GitHub repository'ni ulang
4. Quyidagi sozlamalarni kiriting:

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn --worker-class eventlet -w 1 app:app
```

### 3. Environment Variables Qo'shish

Render Dashboard'da **Environment** bo'limiga quyidagilarni qo'shing:

| Key | Value | Izoh |
|-----|-------|------|
| `BOT_TOKEN` | `7890123456:AAH...` | Telegram Bot Token |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API |
| `JWT_SECRET_KEY` | `random_secret_key_123` | JWT uchun maxfiy kalit |
| `ADMIN_PHONE` | `+998901234567` | Admin telefon raqami |
| `ADMIN_PASSWORD` | `SecurePass123` | Admin paroli |
| `PYTHON_VERSION` | `3.9.18` | Python versiyasi |

### 4. Deploy Qilish

**Create Web Service** tugmasini bosing. Render avtomatik ravishda:
- Kod'ni yuklab oladi
- Dependencies'ni o'rnatadi
- Ilovani ishga tushiradi

Deploy jarayoni 5-10 daqiqa davom etadi.

## 📱 Telegram Bot Sozlash

1. [@BotFather](https://t.me/BotFather) ga boring
2. `/newbot` buyrug'ini yuboring
3. Bot nomini va username'ini kiriting
4. Olingan tokenni `.env` fayliga qo'shing

**Bot Commands:**
```
start - Botni ishga tushirish
help - Yordam
```

## 🔧 Texnologiyalar

**Backend:**
- Flask (Web Framework)
- Flask-SocketIO (Real-time)
- SQLite (Database)
- PyTelegramBotAPI (Telegram)
- Google Generative AI (Gemini)
- JWT (Authentication)

**Frontend:**
- Vanilla JavaScript
- CSS3 (Glassmorphism)
- Chart.js (Analytics)
- QRCode.js (QR Generation)
- Socket.IO Client (Real-time)

## 📊 Struktura

```
queue-manager/
├── app.py                 # Asosiy server
├── bot.py                 # Telegram bot handlerlari
├── database.py            # Database funksiyalari
├── requirements.txt       # Python dependencies
├── Procfile              # Render deploy config
├── .env.example          # Environment variables namunasi
└── t/operator-ai-pro/    # Frontend files
    ├── index.html
    ├── queue.html
    ├── admin.html
    ├── staff.html
    ├── css/
    └── js/
```

## 🎯 Foydalanish

### Bemor uchun:
1. Saytga kiring
2. Telefon raqamingizni kiriting
3. Telegram botdan kelgan kodni tasdiqlang
4. Filial va xizmatni tanlang
5. Navbat raqamingizni oling
6. Real-time kuzatib boring

### Xodim uchun:
1. `/staff.html` ga kiring
2. Login qiling
3. Navbatlarni ko'ring va chaqiring
4. Bemorlarni boshqa bo'limlarga yo'naltiring

### Admin uchun:
1. `/admin.html` ga kiring
2. Tizimni to'liq boshqaring
3. Statistikani ko'ring
4. Xodimlar va xizmatlarni boshqaring

## 🐛 Muammolarni Hal Qilish

**Bot ishlamayapti:**
- `BOT_TOKEN` to'g'riligini tekshiring
- Bot polling'ni qayta ishga tushiring

**Database xatoliklari:**
- `queue_system.db` faylini o'chiring va qayta ishga tushiring

**Render'da crash:**
- Logs'ni tekshiring: Dashboard → Logs
- Environment variables to'g'riligini tekshiring

## 📞 Qo'llab-quvvatlash

Muammolar yoki savollar bo'lsa:
- GitHub Issues ochish
- Telegram: @yourusername

## 📄 Litsenziya

MIT License - O'zingizning loyihalaringizda erkin foydalaning!

---

**Yaratilgan:** 2026
**Versiya:** 2.0
**Mualliflar:** Operator AI Team
