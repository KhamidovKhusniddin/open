# 📦 RENDER MANUAL DEPLOYMENT GUIDE

## Kerakli fayllar ro'yxati (ZIP ga qo'shish uchun):

### ✅ Asosiy fayllar:
- app.py
- bot.py
- database.py
- requirements.txt
- Procfile
- runtime.txt
- .env.example (namuna sifatida)

### ✅ Frontend papka:
- t/ (butun papka)

### ❌ ZIP ga QOSHMASLIK kerak:
- .git/
- __pycache__/
- venv/
- env/
- queue_system.db
- verifications.json
- passwords_gulbahor.txt
- *.pyc
- .env (maxfiy!)

## 🚀 Render.com'da Manual Deploy

### 1. Render.com'ga kiring
https://dashboard.render.com

### 2. New Web Service yarating
- **New +** → **Web Service**
- **Deploy from Git** o'rniga **Deploy manually** tanlang

### 3. Sozlamalar:
```
Name: gulbahor-queue-system
Region: Singapore (yoki Frankfurt)
Branch: main (agar Git ishlatilsa)
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: gunicorn --worker-class gevent -w 1 app:app
```

### 4. Environment Variables qo'shing:

```
BOT_TOKEN=7890123456:AAH...
GEMINI_API_KEY=AIzaSy...
JWT_SECRET_KEY=your_random_secret_key_here
ADMIN_PHONE=+998901234567
ADMIN_PASSWORD=SecurePass123
PYTHON_VERSION=3.9.18
```

### 5. Deploy qiling!

## 📝 Eslatma:
Agar manual deploy ishlamasa, Render CLI dan foydalaning:
```bash
npm install -g render-cli
render login
render deploy
```

Yoki eng oson yo'l - GitHub repository yarating va ulang.
