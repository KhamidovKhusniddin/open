# 🏥 Poliklinika uchun "Smart MedQueue" Taklifi

Mavjud "Operator AI" tizimini Poliklinika yoki Shifoxona uchun moslashtirish bo'yicha aniq takliflar rejasi.

## 1. Tizim Logikasini O'zgartirish
Hozirgi "Tashkilot -> Xizmat" strukturasini tibbiyotga moslaymiz:
- **Xizmatlar (Services)** -> **Mutaxassisliklar** (Terapevt, Okulist, LOR, Jarroh).
- **Yangi tushuncha: Shifokorlar (Doctors)** -> Har bir mutaxassislikda bir nechta shifokor bo'lishi mumkin (Xona №101 - Dr. Aliyev, Xona №102 - Dr. Valiyeva).

## 2. Yangi Funksiyalar (Takliflar)

### 🅰️ Mijozlar (Bemorlar) uchun:
1.  **Oldindan yozilish (Appointment Booking):**
    - Hozirgi "jonli navbat"dan tashqari, aniq soatga (masalan, ertaga 14:30 ga) "bron" qilish imkoniyati.
2.  **AI Tashxischi (Triage):**
    - AI Chatbot bemordan "Qayeringiz og'riyapti?" deb so'raydi va alomatlarga qarab to'g'ri shifokorga (masalan, Nevropatologga) yo'naltiradi.
3.  **Elektron Tibbiy Karta (EHR Lite):**
    - Bemor o'z tarixini (oldingi tashriflar, tashxislar) Telegram bot yoki sayt orqali ko'ra olishi.

### 🅱️ Registratura va Kiosk uchun:
1.  **Kiosk Rejimi:**
    - Kirish eshigi oldiga qo'yilgan sensorli ekran (planshet). Telefoni yo'q yoki keksa odamlar shunchaki tugmani bosib qog'oz chek (bilet) chiqarib oladi.
2.  **Tezkor Registratsiya:**
    - Registratura xodimi uchun pasport ma'lumotlari bilan tezkor navbatga qo'shish oynasi.

### 🅾️ Shifokorlar uchun (Doctor Panel):
1.  **Elektron Retsept:**
    - Shifokor qabul tugagach, tizimga tashxis va dori nomlarini yozadi. Bemorga bu ma'lumot avtomatik Telegram orqali "PDF spravka" bo'lib boradi.
2.  **Laboratoriya Integratsiyasi:**
    - Shifokor "Qon tahlili"ga yuborsa, bemor avtomatik Laboratoriya navbatiga qo'shiladi.

## 3. Texnik Yechimlar
- **Ovozli E'lon:** Kutish zalidagi TV da "Bemor A-45, 12-xonaga kiring" deb ovozli aytish funksiyasi.
- **SMS Xabarnoma:** Telegrami yo'qlar uchun SMS eslatma tizimi (Eskiz.uz yoki shunga o'xshash servis orqali).

## 4. Xulosa (Roadmap)
Agar bu yo'nalish ma'qul bo'lsa, birinchi o'rinda quyidagilarni qilishni maslahat beraman:
1.  **Doctors Table:** Bazaga shifokorlar va xonalar jadvalini qo'shish.
2.  **Booking:** Soatbay yozilish funksiyasini qo'shish.
3.  **Prescription:** Shifokor paneliga "Tashxis yozish" maydonini qo'shish.
