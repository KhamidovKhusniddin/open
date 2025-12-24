import os
import telebot
from telebot import types
import json
import datetime

from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
TOKEN = os.getenv("BOT_TOKEN")
if not TOKEN:
    print("Error: BOT_TOKEN not found in environment")
    exit(1)

DATA_FILE = "verifications.json"

# In-memory storage for pending sessions (chat_id -> uid)
pending_uids = {}

# Initialize Bot
bot = telebot.TeleBot(TOKEN)

def save_verification(user_id, phone_number, username):
    data = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = {}
    
    # Save Phone -> UserID
    data[str(phone_number)] = {
        "user_id": user_id,
        "username": username
    }
    
    import datetime
    data[str(phone_number)]["time"] = datetime.datetime.now().isoformat()

    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def update_uid_with_phone(uid, phone_number):
    data = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            try:
                data = json.load(f)
            except:
                data = {}
    
    key = f"uid_{uid}"
    if key in data:
        data[key]["phone"] = phone_number
        data[key]["verified"] = True
        
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    # Extract arguments (e.g., /start <UID>)
    args = message.text.split()
    if len(args) > 1:
        session_uid = args[1]
        save_session_uid(session_uid, message.chat.id)
        pending_uids[message.chat.id] = session_uid
        
    markup = types.ReplyKeyboardMarkup(one_time_keyboard=True, resize_keyboard=True)
    button = types.KeyboardButton("📱 Raqamni yuborish", request_contact=True)
    markup.add(button)
    
    welcome_text = (
        "👋 <b>Assalomu alaykum!</b>\n\n"
        "Tasdiqlash kodini olish uchun iltimos <b>'Raqamni yuborish'</b> tugmasini bosing."
    )
    bot.send_message(message.chat.id, welcome_text, parse_mode='HTML', reply_markup=markup)

def save_session_uid(uid, chat_id):
    data = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            try:
                data = json.load(f)
            except:
                data = {}
    
    # Save mapping UID -> chat_id
    data[f"uid_{uid}"] = {
        "user_id": chat_id,
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@bot.message_handler(content_types=['contact'])
def handle_contact(message):
    if message.contact is not None:
        phone = message.contact.phone_number
        if not phone.startswith('+'):
            phone = '+' + phone
            
        save_verification(
            message.from_user.id,
            phone,
            message.from_user.username
        )

        # Check if this user had a pending UID session
        if message.chat.id in pending_uids:
            uid = pending_uids[message.chat.id]
            update_uid_with_phone(uid, phone)
            del pending_uids[message.chat.id]
        
        response_text = "✅ Rahmat! Raqamingiz tasdiqlandi. Saytda kod avtomatik yuboriladi."
        # Remove keyboard
        markup = types.ReplyKeyboardRemove()
        bot.send_message(message.chat.id, response_text, reply_markup=markup)

if __name__ == '__main__':
    print("🤖 Tasdiqlash boti ishga tushdi...")
    bot.infinity_polling()
