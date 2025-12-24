# Operator AI - Aqlli Navbat Tizimi 🤖

Ushbu loyiha navbatlarni boshqarish uchun zamonaviy, AI bilan integratsiya qilingan tizimdir.

## 🚀 Xususiyatlari
- **Backend:** Python (Flask) + SQLite
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **AI:** Google Gemini (Chatbot uchun)
- **Xabarnomalar:** Telegram Bot integratsiyasi (1 soat, 30 daqiqa, 10 daqiqa oldin eslatma)
- **Admin Panel:** Real vaqt rejimida statistikalar va boshqaruv.

## 📦 O'rnatish

1. **Repozitoriyani yuklab oling:**
```bash
git clone https://github.com/SIZNING_USERNAMINGIZ/operator-ai.git
cd operator-ai
```

2. **Virtual muhitni yarating va aktivlashtiring:**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. **Kutubxonalarni o'rnating:**
```bash
pip install -r requirements.txt
```

4. **.env faylini sozlang:**
`.env.example` dan nusxa olib `.env` yarating va tokenlarni kiriting:
```
BOT_TOKEN=sizning_bot_tokeningiz
GEMINI_API_KEY=sizning_gemini_kalitingiz
```

5. **Ishga tushirish:**
```bash
python3 app.py
```
Sayt `http://localhost:5000` manzilida ishga tushadi.

---

## ☁️ GitHub-ga Yuklash (Yo'riqnoma)
Loyiha allaqachon git uchun tayyorlangan (`.gitignore` va xavfsizlik sozlamalari joyida).

1. **GitHub** da yangi repozitoriy oching (masalan: `operator-ai`).
2. Terminalda quyidagi buyruqlarni bering:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SIZNING_USERNAMINGIZ/operator-ai.git
git push -u origin main
```
*(Yuqoridagi `SIZNING_USERNAMINGIZ` o'rniga o'z GitHub nomingizni yozing)*

---

## 🚀 Internetga joylash (Deploy)

⚠️ **Muhim:** Bu loyiha **Python (Flask)** va **SQLite** ishlatgani uchun, oddiy **Netlify** yoki **Vercel** da to'liq ishlamaydi (ular asosan frontend uchun).

### Tavsiya etilgan platformalar:
1.  **PythonAnywhere** (Eng oson, bepul varianti bor):
    *   Python va SQLite uchun ideal.
    *   Console orqali repo-ni klonlaysiz va `app.py` ni ishga tushirasiz.
2.  **Render.com** (Web Service):
    *   GitHub-ga ulanadi.
    *   `Build Command`: `pip install -r requirements.txt`
    *   `Start Command`: `gunicorn app:app` (buning uchun `gunicorn` o'rnatish kerak)

### Agar baribir Netlify ishlatmoqchi bo'lsangiz:
Faqat **Frontend** (dizayn) ishlaydi. Backend (navbat olish, admin) ishlamaydi.
*   **Publish directory:** `t/operator-ai-pro`

---

## 🛡 Xavfsizlik
Ushbu loyiha `.env` faylidan foydalanadi. **HECH QACHON** `.env` faylini, `queue_system.db` ni yoki `__pycache__` papkalarini git-ga yuklamang (ular `.gitignore` da yozilgan).
