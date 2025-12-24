from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, emit
import os
import threading
import time
import requests
from datetime import datetime, timedelta

import google.generativeai as genai
import database
import telebot
from telebot import types
import json

from dotenv import load_dotenv

load_dotenv()

# Serve static files from the 't/operator-ai-pro' directory
app = Flask(__name__, static_url_path='', static_folder='t/operator-ai-pro')
CORS(app) 

# Security Setup
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-key-123")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

BOT_TOKEN = os.getenv("BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not BOT_TOKEN or not GEMINI_API_KEY:
    print("Warning: BOT_TOKEN or GEMINI_API_KEY not found in environment")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

# In-memory storage for AI chat sessions
chat_sessions = {}

# Initialize Bot
bot = telebot.TeleBot(BOT_TOKEN)

# In-memory storage for pending sessions (chat_id -> uid)
pending_uids = {}
DATA_FILE = "verifications.json" 

# Initialize DB
database.init_db()

# --- Bot Handlers ---

@bot.message_handler(commands=['start'])
def send_welcome(message):
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
            try: data = json.load(f)
            except: data = {}
    
    data[f"uid_{uid}"] = {
        "user_id": chat_id,
        "timestamp": datetime.now().isoformat()
    }
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def update_uid_with_phone(uid, phone_number):
    data = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            try: data = json.load(f)
            except: data = {}
    
    key = f"uid_{uid}"
    if key in data:
        data[key]["phone"] = phone_number
        data[key]["verified"] = True
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@bot.message_handler(content_types=['contact'])
def handle_contact(message):
    if message.contact is not None:
        phone = message.contact.phone_number
        database.add_user(phone, message.from_user.id, message.from_user.username)

        if message.chat.id in pending_uids:
            uid = pending_uids[message.chat.id]
            update_uid_with_phone(uid, phone)
            del pending_uids[message.chat.id]
        
        bot.send_message(message.chat.id, "✅ Rahmat! Raqamingiz tasdiqlandi.", reply_markup=types.ReplyKeyboardRemove())

# --- Flask Routes ---

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    
    if not phone or not password:
        return jsonify({"success": False, "message": "Phone and password required"}), 400
        
    admin = database.get_admin_user(phone)
    if admin and bcrypt.check_password_hash(admin['password_hash'], password):
        # Include role in identity if needed, or just phone
        access_token = create_access_token(identity=phone)
        return jsonify({"success": True, "token": access_token})
        
    return jsonify({"success": False, "message": "Noto'g'ri login yoki parol"}), 401

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/queues', methods=['POST'])
def sync_queue():
    queue_data = request.json
    phone = queue_data.get('phone')
    if not phone:
        return jsonify({"success": False, "message": "Phone required"}), 400
    
    # --- Check Daily Limit (Max 3) ---
    today_date = queue_data.get('date') or datetime.now().strftime('%Y-%m-%d')
    user_bookings = database.get_queues_by_phone(phone, today_date)
    waiting_bookings = [q for q in user_bookings if q['status'] == 'waiting']
    if len(waiting_bookings) >= 3:
            return jsonify({
            "success": False, 
            "message": "Kunlik limit (3 ta) tugagan. Ertaga urinib ko'ring."
        }), 400
    # ---------------------------------

    success = database.add_queue(queue_data)
    if success:
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Database error"}), 500

@app.route('/api/staff-load', methods=['GET'])
def get_staff_load():
    queues = database.get_todays_queues()
    staff_loads = {}
    for q in queues.values():
        if q.get('status') == 'waiting' and q.get('staff_id'):
            sid = q.get('staff_id')
            staff_loads[sid] = staff_loads.get(sid, 0) + 1
    return jsonify({"success": True, "loads": staff_loads})

@app.route('/api/verify', methods=['POST'])
def verify_phone():
    data = request.json
    phone = data.get('phone')
    if phone:
        user = database.get_user(phone)
        if user:
             return jsonify({"success": True, "data": user})
    return jsonify({"success": False, "message": "Foydalanuvchi topilmadi"}), 404

@app.route('/api/queue/<string:q_id>', methods=['GET'])
def get_single_queue(q_id):
    q = database.get_queue(q_id)
    if q:
        return jsonify({"success": True, "queue": q})
    return jsonify({"success": False, "message": "Queue not found"}), 404

@app.route('/api/queue-position/<string:q_id>', methods=['GET'])
def get_queue_pos(q_id):
    pos = database.get_queue_position(q_id)
    if pos:
        return jsonify({"success": True, "data": pos})
    return jsonify({"success": False, "message": "Queue not found"}), 404

@app.route('/api/admin/queues', methods=['GET'])
@jwt_required()
def admin_get_queues():
    queues_list = database.get_all_queues_list()
    
    conn = database.get_db_connection()
    services = conn.execute('SELECT id, name_uz FROM services').fetchall()
    conn.close()
    service_map = {s['id']: s['name_uz'] for s in services}
    
    queues_dict = {}
    for q in queues_list:
        q_dict = dict(q)
        s_id = q_dict.get('service_id')
        q_dict['service'] = service_map.get(s_id, 'Umumiy')
        queues_dict[q_dict['id']] = q_dict

    return jsonify({"success": True, "queues": queues_dict})

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    stats = database.get_admin_stats()
    return jsonify({"success": True, "stats": stats})

@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def admin_get_analytics():
    data = database.get_analytics_data()
    return jsonify({"success": True, "data": data})

@app.route('/api/admin/call_next', methods=['POST'])
@jwt_required()
def admin_call_next():
    current_queues = database.get_todays_queues().values() 
    waiting_list = [q for q in current_queues if q['status'] == 'waiting']
    waiting_list.sort(key=lambda x: x['created_at']) 
    
    if not waiting_list:
        return jsonify({"success": False, "message": "Kutayotganlar yo'q"})
    
    next_client = waiting_list[0]
    database.update_queue_status(next_client['id'], 'serving')
    notify_user_call(next_client)
    
    # Emit real-time update
    socketio.emit('queue_updated', {'type': 'call_next', 'queue_id': next_client['id']})
    
    return jsonify({"success": True, "queue": database.get_queue(next_client['id'])})

@app.route('/api/admin/update_status', methods=['POST'])
@jwt_required()
def admin_update_status():
    data = request.json
    q_id = data.get('id')
    new_status = data.get('status')
    if q_id and new_status:
        database.update_queue_status(q_id, new_status)
        socketio.emit('queue_updated', {'type': 'status_change', 'queue_id': q_id, 'status': new_status})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid data"}), 400

def notify_user_call(queue_item):
    try:
        phone = database.normalize_phone(queue_item.get('phone', ''))
        user = database.get_user(phone)
        if user and user.get('user_id'):
            msg = (
                f"🎉 <b>Diqqat! Navbatingiz yetib keldi!</b>\n\n"
                f"Raqamingiz: <b>{queue_item['number']}</b>\n"
                f"Iltimos, operator oldiga boring."
            )
            bot.send_message(user['user_id'], msg, parse_mode='HTML')
    except Exception as e:
        print(f"❌ Notification error: {e}")

@app.route('/api/chat', methods=['POST'])
def chat_ai():
    data = request.json
    user_message = data.get('message')
    phone = data.get('phone') 
    
    if not user_message:
        return jsonify({"response": "Iltimos, savol bering."})

    try:
        # Load Knowledge Base
        kb_data = {}
        if os.path.exists("knowledge_base.json"):
            with open("knowledge_base.json", "r") as f:
                kb_data = json.load(f)
        
        # Build System Context
        context = "Siz TASDIQLANGAN rasmiy Operator AI yordamchisisiz. Vazifangiz: Mijozlarga tashkilot, xizmatlar va kerakli hujjatlar haqica aniq ma'lumot berish.\n\n"
        org = kb_data.get('organization', {})
        context += f"Tashkilot: {org.get('name')}. Manzil: {org.get('address')}. Ish vaqti: {org.get('working_hours')}.\n"
        
        # Management of AI History per User (Phone based)
        chat_id = phone or "guest"
        if chat_id not in chat_sessions:
            chat_sessions[chat_id] = model.start_chat(history=[])
        
        chat = chat_sessions[chat_id]
        response = chat.send_message(f"System Context: {context}\n\nUser Question: {user_message}")
        
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"response": "Uzr, hozir javob bera olmayman."})

def notification_scheduler():
    while True:
        try:
            queues = database.get_todays_queues()
            now = datetime.now()
            for q_id, q in queues.items():
                if q['status'] != 'waiting' or not q.get('date') or not q.get('time'):
                    continue
                
                user = database.get_user(q['phone'])
                if not user: continue
                    
                appt_dt = datetime.fromisoformat(f"{q['date']}T{q['time']}")
                minutes_left = (appt_dt - now).total_seconds() / 60
                
                level = q.get('notification_level', 0)
                msg = None
                
                if 55 <= minutes_left <= 65 and level < 1:
                    msg = f"⏳ 1 soat qoldi. Raqam: {q['number']}"
                    level = 1
                elif 25 <= minutes_left <= 35 and level < 2:
                    msg = f"⏱ 30 daqiqa qoldi!"
                    level = 2
                elif 5 <= minutes_left <= 15 and level < 3:
                    msg = f"🚨 10 daqiqa qoldi! Shoshiling."
                    level = 3
                
                if msg:
                    requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", 
                                  json={"chat_id": user['user_id'], "text": msg})
                    database.update_notification_level(q_id, level)
        except Exception as e:
            print(f"Scheduler error: {e}")
        time.sleep(60)

if __name__ == '__main__':
    threading.Thread(target=notification_scheduler, daemon=True).start()
    threading.Thread(target=bot.infinity_polling, daemon=True).start()
    socketio.run(app, debug=False, port=5000, host='0.0.0.0', allow_unsafe_werkzeug=True)
