import eventlet
eventlet.monkey_patch()

print("🏁 Pulse: app.py is starting execution...")

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
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
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
static_folder = os.path.join(BASE_DIR, 't', 'operator-ai-pro')
app = Flask(__name__, static_url_path='', static_folder=static_folder)
CORS(app) 

# Security Setup
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
if not app.config['JWT_SECRET_KEY']:
    print("FATAL: JWT_SECRET_KEY is missing!")
    # For initial deployment, we can use a fallback but warn strongly
    # Strictly for Render debugging, otherwise it crashes silently
    app.config['JWT_SECRET_KEY'] = "emergency_fallback_secret_change_me"

app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

BOT_TOKEN = os.getenv("BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not BOT_TOKEN:
    print("FATAL: BOT_TOKEN is missing!")
if not GEMINI_API_KEY:
    print("FATAL: GEMINI_API_KEY is missing!")

if BOT_TOKEN and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-flash-latest')
        print("✅ Gemini AI initialized.")
    except Exception as e:
        print(f"❌ Gemini Init Error: {e}")
        model = None
else:
    model = None

# In-memory storage for AI chat sessions
chat_sessions = {}

# Initialize Bot safely
class DummyBot:
    def __getattr__(self, name):
        def dummy_func(*args, **kwargs):
            return None
        return dummy_func
    def message_handler(self, *args, **kwargs):
        return lambda f: f
    def callback_query_handler(self, *args, **kwargs):
        return lambda f: f

bot = DummyBot()
if BOT_TOKEN:
    try:
        bot = telebot.TeleBot(BOT_TOKEN)
        print("✅ Telegram Bot initialized.")
    except Exception as e:
        print(f"❌ Bot Init Error: {e}")
        bot = DummyBot()
else:
    print("⚠️ BOT_TOKEN missing, bot functions will be disabled (DummyBot active).")

# In-memory storage for pending sessions (chat_id -> uid)
pending_uids = {}
DATA_FILE = "verifications.json" 

# Initialize DB
database.init_db()

# --- Auto Admin Creation for Deployment ---
def auto_create_admin():
    admin_phone = os.getenv("ADMIN_PHONE")
    admin_pass = os.getenv("ADMIN_PASS")
    if admin_phone and admin_pass:
        print(f"DEBUG: Found ADMIN_PHONE={admin_phone}, creating/updating admin...")
        pwd_hash = bcrypt.generate_password_hash(admin_pass).decode('utf-8')
        database.add_user(admin_phone, None, "Admin", "system_admin", pwd_hash)
        print(f"✅ AUTOMATIC: System Admin created/updated for {admin_phone}")
    else:
        print("DEBUG: No ADMIN_PHONE/ADMIN_PASS env vars found for auto-creation.")

# Run initial setup always on import/startup
auto_create_admin()

# --- RBAC Helpers ---
from functools import wraps
def role_required(roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"success": False, "message": "Ruxsat berilmagan"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

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

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    # Security Policy
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.socket.io https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com data: https://cdnjs.cloudflare.com; connect-src 'self'; img-src 'self' data:;"
    return response

@app.route('/ping')
def ping():
    return "Pong! Server is alive.", 200

# --- Flask Routes ---

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    # 1. Anti-Brute-Force: Artificial Delay
    time.sleep(1.0) 
    
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()
    print(f"Login attempt: phone='{phone}', password_length={len(password) if password else 0}")
    
    import sys
    print(f"Login attempt: phone='{phone}'", file=sys.stderr)
    
    if not phone or not password:
        return jsonify({"success": False, "message": "Phone and password required"}), 400
        
    # Standard check
    admin = database.get_admin_user(phone)
    
    # If not found, try case-insensitive for alphanumeric usernames
    if not admin and any(c.isalpha() for c in phone):
        conn = database.get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE LOWER(phone) = LOWER(?) AND role IN ("admin", "system_admin", "org_admin", "staff")', (phone,)).fetchone()
        conn.close()
        if user: admin = dict(user)

    if admin and bcrypt.check_password_hash(admin['password_hash'], password):
        # Create token with additional claims for RBAC
        access_token = create_access_token(
            identity=phone,
            additional_claims={
                "role": admin['role'],
                "org_id": admin.get('org_id'),
                "branch_id": admin.get('branch_id')
            }
        )
        return jsonify({
            "success": True, 
            "token": access_token,
            "user": {
                "phone": admin['phone'],
                "role": admin['role'],
                "org_id": admin.get('org_id')
            }
        })
        
    return jsonify({"success": False, "message": "Noto'g'ri login yoki parol"}), 401

# --- SuperAdmin Routes ---

@app.route('/api/super/organizations', methods=['GET', 'POST'])
@role_required(['system_admin', 'admin']) # 'admin' kept for legacy/compatibility
def super_organizations():
    if request.method == 'POST':
        data = request.json
        name = data.get('name')
        if not name: return jsonify({"success": False, "message": "Nomi kiritilmadi"}), 400
        org_id = database.add_organization(name)
        return jsonify({"success": True, "org_id": org_id})
    return jsonify({"success": True, "organizations": database.get_organizations()})

@app.route('/api/super/branches', methods=['POST'])
@role_required(['system_admin', 'admin', 'org_admin'])
def super_add_branch():
    data = request.json
    org_id = data.get('org_id')
    name = data.get('name')
    address = data.get('address')
    
    # IDOR check for org_admin
    claims = get_jwt()
    if claims.get('role') == 'org_admin' and str(org_id) != str(claims.get('org_id')):
        return jsonify({"success": False, "message": "Ruxsat yo'q"}), 403
        
    if not org_id or not name: return jsonify({"success": False, "message": "Ma'lumotlar yetarli emas"}), 400
    branch_id = database.add_branch(org_id, name, address)
    return jsonify({"success": True, "branch_id": branch_id})

@app.route('/api/super/create-admin', methods=['POST'])
@role_required(['system_admin', 'admin'])
def super_create_admin():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    role = data.get('role', 'org_admin')
    org_id = data.get('org_id')
    branch_id = data.get('branch_id')
    
    if not phone or not password:
        return jsonify({"success": False, "message": "Telefon va parol kerak"}), 400
        
    pwd_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    database.add_user(phone, None, phone, role, pwd_hash, org_id, branch_id)
    return jsonify({"success": True})

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    """Health Check Endpoint for Monitoring"""
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0" 
    })

@app.route('/diag')
def diagnostic():
    """Diagnostic endpoint to check environment on Render"""
    return jsonify({
        "env": {
            "PORT": os.getenv("PORT"),
            "DB_NAME": os.getenv("DB_NAME"),
            "BOT_TOKEN": "set" if os.getenv("BOT_TOKEN") else "MISSING",
            "GEMINI_API_KEY": "set" if os.getenv("GEMINI_API_KEY") else "MISSING",
            "JWT_SECRET_KEY": "set" if os.getenv("JWT_SECRET_KEY") else "MISSING"
        },
        "cwd": os.getcwd(),
        "files": os.listdir('.'),
        "db_writable": os.access('.', os.W_OK)
    })

@app.before_request
def log_request_start():
    request.start_time = time.time()

@app.after_request
def log_request_end(response):
    # Skip logging for static assets to keep logs clean
    if request.path.startswith(('/static', '/js', '/css', '/img')):
        return response
        
    duration = time.time() - getattr(request, 'start_time', time.time())
    # ANSI colors for better visibility in terminal
    status_color = "\033[92m" if response.status_code < 400 else "\033[91m"
    reset_color = "\033[0m"
    
    print(f"📝 {request.remote_addr} - [{request.method}] {request.path} - {status_color}{response.status_code}{reset_color} ({duration:.3f}s)")
    return response

# Static serving for API-related tools if needed
# (Catch-all moved to end)

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

@app.route('/api/branches', methods=['GET'])
def get_public_branches():
    org_id = request.args.get('org_id')
    return jsonify({"success": True, "branches": database.get_branches(org_id)})

@app.route('/api/admin/queues', methods=['GET'])
@jwt_required()
def admin_get_queues():
    claims = get_jwt()
    role = claims.get("role")
    org_id = claims.get("org_id")
    
    queues_list = database.get_all_queues_list()
    
    # Filter by org_id if not system_admin
    if role != 'system_admin' and org_id:
        queues_list = [q for q in queues_list if q.get('org_id') == org_id]
    
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
    claims = get_jwt()
    org_id = claims.get("org_id") if claims.get("role") != "system_admin" else None
    
    stats = database.get_admin_stats(org_id)
    return jsonify({"success": True, "stats": stats})

@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def admin_get_analytics():
    claims = get_jwt()
    # Filter by org_id if not system_admin
    org_id = claims.get("org_id") if claims.get("role") != "system_admin" else None
    
    data = database.get_analytics_data(org_id)
    return jsonify({"success": True, "data": data})

@app.route('/api/admin/call_next', methods=['POST'])
@jwt_required()
def admin_call_next():
    claims = get_jwt()
    org_id = claims.get("org_id") if claims.get("role") != "system_admin" else None
    
    current_queues = database.get_todays_queues(org_id).values() 
    waiting_list = [q for q in current_queues if q['status'] == 'waiting']
    waiting_list.sort(key=lambda x: x['created_at']) 
    
    if not waiting_list:
        return jsonify({"success": False, "message": "Kutayotganlar yo'q"})
    
    next_client = waiting_list[0]
    database.update_queue_status(next_client['id'], 'serving')
    
    # Verify the item belongs to the caller's org for security (optional here since filtered above)
    notify_user_call(next_client)
    
    # Emit real-time update
    socketio.emit('queue_updated', {'type': 'call_next', 'queue_id': next_client['id'], 'org_id': next_client.get('org_id')})
    
    return jsonify({"success": True, "queue": database.get_queue(next_client['id'])})

@app.route('/api/admin/update_status', methods=['POST'])
@jwt_required()
def admin_update_status():
    data = request.json
    q_id = data.get('id')
    new_status = data.get('status')
    
    claims = get_jwt()
    user_role = claims.get("role")
    user_org_id = claims.get("org_id")
    
    if q_id and new_status:
        # IDOR Protection
        q = database.get_queue(q_id)
        if not q:
             return jsonify({"success": False, "message": "Queue not found"}), 404
             
        if user_role != 'system_admin' and str(q.get('org_id')) != str(user_org_id):
             return jsonify({"success": False, "message": "Sizda bu amal uchun ruxsat yo'q"}), 403

        database.update_queue_status(q_id, new_status)
        socketio.emit('queue_updated', {'type': 'status_change', 'queue_id': q_id, 'status': new_status, 'org_id': q.get('org_id')})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid data"}), 400

@app.route('/api/admin/transfer_queue', methods=['POST'])
@jwt_required()
def admin_transfer_queue():
    data = request.json
    q_id = data.get('id')
    new_svc_id = data.get('service_id')
    
    if not q_id or not new_svc_id:
        return jsonify({"success": False, "message": "Ma'lumotlar yetarli emas"}), 400
        
    claims = get_jwt()
    user_org_id = claims.get("org_id")
    user_role = claims.get("role")
    
    # 1. Verify queue and permission
    q = database.get_queue(q_id)
    if not q: return jsonify({"success": False, "message": "Navbat topilmadi"}), 404
    
    if user_role != 'system_admin' and str(q.get('org_id')) != str(user_org_id):
        return jsonify({"success": False, "message": "Ruxsat yo'q"}), 403
        
    # 2. Update Queue: Status -> waiting, Svc -> new, Staff -> None
    conn = database.get_db_connection()
    try:
        conn.execute('UPDATE queues SET status = "waiting", service_id = ?, staff_id = NULL WHERE id = ?', (new_svc_id, q_id))
        conn.commit()
    finally:
        conn.close()
        
    # 3. Notify user via Telegram
    try:
        phone = database.normalize_phone(q.get('phone', ''))
        user = database.get_user(phone)
        if user and user.get('user_id'):
            # Fetch service name for nice message
            conn = database.get_db_connection()
            svc = conn.execute('SELECT name_uz FROM services WHERE id = ?', (new_svc_id,)).fetchone()
            conn.close()
            svc_name = svc['name_uz'] if svc else "yangi bo'lim"
            
            msg = (
                f"🔄 <b>Yo'naltirish!</b>\n\n"
                f"Siz <b>{svc_name}</b> xonasiga yo'naltirildingiz.\n"
                f"Raqamingiz: <b>{q['number']}</b>\n"
                f"Iltimos, navbat kuting."
            )
            bot.send_message(user['user_id'], msg, parse_mode='HTML')
    except Exception as e: print(f"Transfer notify error: {e}")
    
    socketio.emit('queue_updated', {'type': 'transfer', 'queue_id': q_id, 'new_service': new_svc_id, 'org_id': q.get('org_id')})
    return jsonify({"success": True})

# --- Org Admin Settings API ---

@app.route('/api/org/settings', methods=['GET', 'POST'])
@role_required(['org_admin'])
def org_settings():
    claims = get_jwt()
    org_id = claims.get("org_id")
    
    if request.method == 'GET':
        # Fetch current info
        # Reuse existing get_organizations but filter? Or simple query.
        conn = database.get_db_connection()
        org = conn.execute('SELECT * FROM organizations WHERE id = ?', (org_id,)).fetchone()
        conn.close()
        return jsonify({"success": True, "org": dict(org) if org else {}})
        
    if request.method == 'POST':
        data = request.json
        name = data.get('name')
        if not name: return jsonify({"success": False, "message": "Nom kiritilmadi"}), 400
        
        success = database.update_organization(org_id, name)
        return jsonify({"success": success})

@app.route('/api/org/services', methods=['GET', 'POST', 'DELETE'])
@role_required(['org_admin'])
def org_services():
    claims = get_jwt()
    org_id = claims.get("org_id")
    
    if request.method == 'GET':
        return jsonify({"success": True, "services": database.get_org_services(org_id)})
        
    if request.method == 'POST':
        data = request.json
        name = data.get('name')
        duration = data.get('duration', 15)
        # For simplicity, assign to first branch or pass branch_id
        # Ideally UI should allow selecting branch if multi-branch, but MVP:
        branches = database.get_branches(org_id)
        if not branches: return jsonify({"success": False, "message": "Filial yo'q"}), 400
        branch_id = branches[0]['id'] 
        
        svc_id = database.add_service(org_id, branch_id, name, duration)
        return jsonify({"success": True, "id": svc_id})
        
    if request.method == 'DELETE':
        svc_id = request.args.get('id')
        if database.delete_service(svc_id, org_id):
            return jsonify({"success": True})
        return jsonify({"success": False, "message": "Xatolik"}), 400

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
        else:
            # Fallback: Check JSON if not in DB
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r') as f:
                    ver_data = json.load(f)
                    # Try to find by phone
                    for key, val in ver_data.items():
                         if val.get('phone') == phone or key == phone:
                             bot.send_message(val['user_id'], msg, parse_mode='HTML')
                             break
    except Exception as e:
        print(f"❌ Notification error: {e}")

@app.route('/api/config/bot', methods=['GET'])
def get_bot_info():
    try:
        bot_info = bot.get_me()
        return jsonify({
            "success": True, 
            "username": bot_info.username
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/auth/send-code', methods=['POST'])
def send_verification_code():
    data = request.json
    phone = data.get('phone')
    uid = data.get('uid')
    
    if not phone or not uid:
        return jsonify({"success": False, "message": "Phone and UID required"}), 400
        
    # Check if we have a chat_id for this UID from the shared file
    chat_id = None
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                ver_data = json.load(f)
                uid_key = f"uid_{uid}"
                if uid_key in ver_data:
                    chat_id = ver_data[uid_key].get('user_id')
                
                # Also check by phone if already verified
                if not chat_id:
                     phone_key = database.normalize_phone(phone)
                     # The file format in bot.py for phone is keys like "+998..."
                     # But let's check broadly
                     if phone_key in ver_data:
                         chat_id = ver_data[phone_key].get('user_id')
        except:
            pass

    if chat_id:
        import random
        code = str(random.randint(1000, 9999))
        try:
            msg = f"🔐 Sizning tasdiqlash kodingiz: <b>{code}</b>"
            # In a real app, store this code in memory/cache/db with a TTL (Time To Live)
            # For this MVP, we will only send it to Telegram and NOT return it to frontend.
            # Verifying will be done via a separate check-status or similar logic.
            bot.send_message(chat_id, msg, parse_mode='HTML')
            return jsonify({"success": True, "message": "Kod yuborildi"}) 
        except Exception as e:
            return jsonify({"success": False, "message": f"Telegram error: {str(e)}"}), 500
    
    return jsonify({"success": False, "message": "User not found. Please start bot."}), 404

@app.route('/api/auth/check-status', methods=['POST'])
def check_auth_status():
    data = request.json
    uid = data.get('uid')
    phone = data.get('phone')
    
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                ver_data = json.load(f)
                
                # Check UID
                if uid and f"uid_{uid}" in ver_data:
                    return jsonify({"success": True, "found": True, "data": ver_data[f"uid_{uid}"]})
                
                # Check Phone
                if phone:
                    phone_key = database.normalize_phone(phone)
                    for key, val in ver_data.items():
                        if key == phone or key == phone_key or (isinstance(val, dict) and val.get('phone') == phone_key):
                             # SYNC TO DB: Important!
                             if val.get('user_id'):
                                 database.add_user(phone, val['user_id'], val.get('username', 'user'))
                             
                             return jsonify({"success": True, "found": True, "data": val})

        except:
            pass
            
    return jsonify({"success": True, "found": False})

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


# --- Web-Based Setup (Emergency/First-Time) ---
@app.route('/init-admin', methods=['GET', 'POST'])
def init_admin_page():
    # Allow resetting even if admin exists (Emergency Mode)
    # if database.check_system_admin_exists():
    #    pass 
    
    if request.method == 'POST':
        phone = request.form.get('phone')
        password = request.form.get('password')
        
        if not phone or not password:
            return "Phone and password required", 400
            
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        # This will UPDATE if user exists due to ON CONFLICT(phone) in add_user
        database.add_user(phone, None, "SuperAdmin", "system_admin", hashed_pw)
        
        return f"""
        <h1>✅ Parol yangilandi!</h1>
        <p>Admin: <b>{phone}</b></p>
        <p>Parol: <b>{password}</b> (O'zgartirildi)</p>
        <p><a href='/admin.html'>Admin Panelga o'tish</a></p>
        """

    # Show Setup Form
    return """
    <!DOCTYPE html>
    <html data-theme="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Setup Admin</title>
        <style>
            body { background: #020617; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; }
            .card { background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 400px; }
            input { width: 100%; padding: 0.8rem; margin-bottom: 1rem; border-radius: 0.5rem; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; }
            button { width: 100%; padding: 0.8rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold; }
            button:hover { background: #1d4ed8; }
            h2 { margin-top: 0; text-align: center; margin-bottom: 1.5rem; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🚀 Tizimni sozlash</h2>
            <form method="POST">
                <label>Telefon raqam (Login)</label>
                <input type="text" name="phone" placeholder="+998901234567" required>
                
                <label>Parol</label>
                <input type="password" name="password" placeholder="Yangi parol o'ylab toping" required>
                
                <button type="submit">Admin Yaratish</button>
            </form>
        </div>
    </body>
    </html>
    """

# --- Catch-all for Static Assets (Must be last) ---
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

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

# Startup logic
print("🚀 Operator AI System is preparing to run...")
print(f"📦 Environment Check: BOT_TOKEN={'set' if BOT_TOKEN else 'MISSING'}, GEMINI={'set' if GEMINI_API_KEY else 'MISSING'}")

# Start scheduler thread
try:
    threading.Thread(target=notification_scheduler, daemon=True).start()
    print("⏰ Notification scheduler thread started.")
except Exception as e:
    print(f"❌ Error starting scheduler: {e}")

if __name__ == '__main__':
    try:
        # Check static folder
        abs_static = os.path.abspath(app.static_folder)
        print(f"📁 Static folder: {abs_static}")
        print(f"📂 Folder exists: {os.path.exists(abs_static)}")
        if os.path.exists(abs_static):
            print(f"📄 Files in static: {os.listdir(abs_static)[:5]}...")
            
        # Use dynamic port for Render
        port = int(os.environ.get("PORT", 5000))
        print(f"🌐 Running script mode on 0.0.0.0:{port}")
        
        # Run with eventlet
        socketio.run(app, port=port, host='0.0.0.0', allow_unsafe_werkzeug=True)
    except Exception as e:
        print(f"‼️ CRITICAL CRASH ON STARTUP: {e}")
        import traceback
        traceback.print_exc()
