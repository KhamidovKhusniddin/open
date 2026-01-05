# 🚀 RENDER.COM DEPLOYMENT CHECKLIST

## ✅ Tayyor bo'lgan fayllar:
- [x] `app.py` - Asosiy server
- [x] `bot.py` - Telegram bot
- [x] `database.py` - Database
- [x] `requirements.txt` - Dependencies
- [x] `Procfile` - Render config
- [x] `.gitignore` - Git ignore rules
- [x] `README.md` - Documentation

## 📝 Render.com'da qilish kerak bo'lgan ishlar:

### 1. GitHub'ga Push Qilish
```bash
cd "c:\Users\ki770\OneDrive\Desktop\queue manager site (Copy)"
git init
git add .
git commit -m "Ready for Render deployment"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 2. Render.com Sozlamalari

**Service Type:** Web Service

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
gunicorn --worker-class eventlet -w 1 app:app
```

**Environment Variables (Render Dashboard'da qo'shing):**

| Variable | Qiymat | Qayerdan olish |
|----------|--------|----------------|
| `BOT_TOKEN` | `7890123456:AAH...` | @BotFather (Telegram) |
| `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio |
| `JWT_SECRET_KEY` | `random_string_123` | O'zingiz yarating (32+ belgi) |
| `ADMIN_PHONE` | `+998901234567` | O'z raqamingiz |
| `ADMIN_PASSWORD` | `SecurePass123!` | Kuchli parol |
| `PYTHON_VERSION` | `3.9.18` | Python versiyasi |

### 3. Telegram Bot Token Olish

1. Telegram'da @BotFather ga boring
2. `/newbot` yuboring
3. Bot nomini kiriting (masalan: "Gulbahor Navbat Bot")
4. Username kiriting (masalan: "gulbahor_queue_bot")
5. Olingan tokenni `BOT_TOKEN` ga qo'ying

### 4. Google Gemini API Key (Ixtiyoriy)

1. https://aistudio.google.com/app/apikey ga boring
2. "Create API Key" bosing
3. Olingan kalitni `GEMINI_API_KEY` ga qo'ying

### 5. Deploy Qilish

1. Render.com'da "Create Web Service" bosing
2. 5-10 daqiqa kuting
3. Deploy tugagach, URL oling (masalan: `https://your-app.onrender.com`)
4. Saytni oching va test qiling!

## 🧪 Test Qilish

Deploy tugagach:
1. Saytga kiring
2. Telefon raqamingizni kiriting
3. Telegram botdan kod oling
4. Navbat yarating
5. Admin panelga kiring (`/admin.html`)

## ⚠️ Muhim Eslatmalar

- **Database:** Render free plan'da database har 15 daqiqada o'chib qolishi mumkin. Production uchun Render PostgreSQL yoki boshqa database xizmatidan foydalaning.
- **Bot Polling:** Render'da bot polling ishlashi uchun web service doim aktiv bo'lishi kerak.
- **Environment Variables:** Hech qachon `.env` faylini Git'ga push qilmang!

## 🔧 Muammolarni Hal Qilish

**Deploy muvaffaqiyatsiz:**
- Render Logs'ni tekshiring
- `requirements.txt` to'g'riligini tekshiring
- Python versiyasini tekshiring

**Bot ishlamayapti:**
- `BOT_TOKEN` to'g'ri kiritilganini tekshiring
- Render Logs'da bot polling xatolarini qidiring

**Database xatolari:**
- Render'da SQLite ishlamasa, PostgreSQL'ga o'ting
- Environment variables to'g'riligini tekshiring

## 📞 Yordam

Muammo bo'lsa:
1. Render Logs'ni o'qing (Dashboard → Logs)
2. GitHub Issues oching
3. README.md'ni qayta o'qing

---

**Omad tilaymiz! 🚀**
