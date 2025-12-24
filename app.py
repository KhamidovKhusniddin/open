from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import threading
import time
import requests
from datetime import datetime, timedelta

import google.generativeai as genai
import database

from dotenv import load_dotenv

load_dotenv()

# Serve static files from the 't/operator-ai-pro' directory
app = Flask(__name__, static_url_path='', static_folder='t/operator-ai-pro')
CORS(app) # Enable CORS for Netlify

BOT_TOKEN = os.getenv("BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not BOT_TOKEN or not GEMINI_API_KEY:
    print("Warning: BOT_TOKEN or GEMINI_API_KEY not found in environment")

genai.configure(api_key=GEMINI_API_KEY)
# Use a valid model
model = genai.GenerativeModel('gemini-flash-latest')

# Initialize DB
database.init_db()

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
    
    if not phone.startswith('+'):
        phone = '+' + phone
    
    # --- Check Daily Limit (Max 3) ---
    today_date = queue_data.get('date')
    if today_date:
        user_bookings = database.get_queues_by_phone(phone, today_date)
        # Filter for active bookings
        waiting_bookings = [q for q in user_bookings if q['status'] == 'waiting']
        if len(waiting_bookings) >= 3:
             return jsonify({
                "success": False, 
                "message": "Kunlik limit (3 ta) tugagan. Ertaga urinib ko'ring."
            }), 400
    # ---------------------------------

    queue_id = queue_data.get('id')
    
    # Construct/Update queue object (SQLite handles update via INSERT logic if tailored, but here we treat as overwrite/new based on our simple API usage)
    # The frontend generates a random ID. We trust it for now.
    
    new_queue = {
        "id": queue_id,
        "phone": phone,
        "number": queue_data.get('number'),
        "status": queue_data.get('status', 'waiting'),
        "date": queue_data.get('date'),
        "time": queue_data.get('time'),
        "staffId": queue_data.get('staffId'),
        "serviceId": queue_data.get('serviceId'),
        "branchId": queue_data.get('branchId'),
        "created_at": datetime.now().isoformat(),
        "last_notified": datetime.now().isoformat()
    }
    
    # If exists, we might want to preserve some fields, but for this simplified flow:
    success = database.add_queue(new_queue)
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "message": "Database error"}), 500

@app.route('/api/staff-load', methods=['GET'])
def get_staff_load():
    # Helper to calculate staff load from DB
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
    session_uid = data.get('uid')
    
    # SQLite doesn't store pending sessions easily in 'users' table unless we adapt bot.py logic too.
    # For now, let's keep 'verifications.json' ONLY for the BOT's temporary verification,
    # OR we read from 'users' table which the bot should populate.
    # Let's assume bot.py will also be updated to use SQLite users table.
    
    # For backward compatibility during migration, we might check file, but target is SQLite
    if phone:
        if not phone.startswith('+'):
            phone = '+' + phone
        user = database.get_user(phone)
        if user:
             return jsonify({
                "success": True, 
                "message": "Tasdiqlandi",
                "data": user
            })
    
    # Fallback/Check logic for UID (omitted for brevity as primary flow is phone)
    return jsonify({
        "success": False, 
        "message": "Foydalanuvchi topilmadi"
    }), 404

@app.route('/api/queue/<string:q_id>', methods=['GET'])
def get_single_queue(q_id):
    q = database.get_queue(q_id)
    if q:
        return jsonify({"success": True, "queue": q})
    return jsonify({"success": False, "message": "Queue not found"}), 404

@app.route('/api/admin/queues', methods=['GET'])
def admin_get_queues():
    queues_list = database.get_all_queues_list()
    
    # Enrich with Service Names
    # In a real app with JOINs this is automatic, but here we do it python-side for simplicity or update DB query
    # Let's fetch services map
    conn = database.get_db_connection()
    services = conn.execute('SELECT id, name_uz FROM services').fetchall()
    conn.close()
    service_map = {s['id']: s['name_uz'] for s in services}
    
    queues_dict = {}
    for q in queues_list:
        q_dict = dict(q)
        # Map service_id to name
        s_id = q_dict.get('service_id') or q_dict.get('serviceId') # Handle both cases if inconsistency
        q_dict['service'] = service_map.get(s_id, 'General')
        queues_dict[q_dict['id']] = q_dict

    return jsonify({"success": True, "queues": queues_dict})

@app.route('/api/admin/stats', methods=['GET'])
def admin_get_stats():
    stats = database.get_admin_stats()
    return jsonify({"success": True, "stats": stats})

@app.route('/api/admin/call_next', methods=['POST'])
def admin_call_next():
    # Fetch waiting queues from DB
    current_queues = database.get_todays_queues().values() 
    waiting_list = [q for q in current_queues if q['status'] == 'waiting']
    waiting_list.sort(key=lambda x: x['created_at']) # FIFO
    
    if not waiting_list:
        return jsonify({"success": False, "message": "Kutayotganlar yo'q"})
    
    next_client = waiting_list[0]
    next_client_id = next_client['id']
    
    database.update_queue_status(next_client_id, 'serving')
    
    # Notify User via Telegram
    notify_user_call(next_client)
    
    updated_client = database.get_queue(next_client_id)
    return jsonify({"success": True, "queue": updated_client})

@app.route('/api/admin/update_status', methods=['POST'])
def admin_update_status():
    data = request.json
    q_id = data.get('id')
    new_status = data.get('status')
    
    if q_id and new_status:
        database.update_queue_status(q_id, new_status)
        return jsonify({"success": True})
        
    return jsonify({"success": False, "message": "Invalid data"}), 400

def notify_user_call(queue_item):
    """Notify user that it's their turn"""
    try:
        phone = queue_item.get('phone')
        user = database.get_user(phone)
        if user and user.get('user_id'):
            user_id = user['user_id']
            msg = f"🎉 <b>Diqqat! Navbatingiz yetib keldi!</b>\n\nRaqamingiz: <b>{queue_item['number']}</b>\nIltimos, operator oldiga boring."
            requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json={"chat_id": user_id, "text": msg, "parse_mode": "HTML"})
            print(f"Call notification sent to {phone}")
    except Exception as e:
        print(f"Notification error: {e}")

@app.route('/api/chat', methods=['POST'])
def chat_ai():
    data = request.json
    user_message = data.get('message')
    queue_id = data.get('queue_id')
    
    if not user_message:
        return jsonify({"response": "Iltimos, savol bering."})

    try:
        # Load Knowledge Base
        kb_data = {}
        if os.path.exists("knowledge_base.json"):
            with open("knowledge_base.json", "r") as f:
                kb_data = json.load(f)
        
        # Build Context
        context = "Siz TASDIQLANGAN rasmiy Operator AI yordamchisisiz. Vazifangiz: Mijozlarga tashkilot, xizmatlar va kerakli hujjatlar haqida aniq ma'lumot berish.\n\n"
        
        # Add Organization Info
        org = kb_data.get('organization', {})
        context += f"Tashkilot: {org.get('name')}.\n"
        context += f"Manzil: {org.get('address')}.\n"
        context += f"Ish vaqti: {org.get('working_hours')}. Tushlik: {org.get('lunch_break')}.\n"
        context += f"Aloqa: {org.get('contact')}.\n\n"
        
        # Add Services Info
        context += "Xizmatlar va Hujjatlar:\n"
        for service in kb_data.get('services', []):
            docs = ", ".join(service.get('required_documents', []))
            context += f"- {service['name']}: Kerakli hujjatlar: {docs}. Narxi: {service.get('price')}. Vaqt: {service.get('process_time')}.\n"
            
        context += "\nJavob berish uslubi: Qisqa, londa va xushmuomala bo'ling. Faqat bor ma'lumotga asoslaning. Agar so'ralgan ma'lumot yo'q bo'lsa, 'Uzr, bu haqida ma'lumotim yo'q' deng.\n"

        # Add User Queue Context
        if queue_id:
             q = database.get_queue(queue_id)
             if q:
                context += f"\nFoydalanuvchi ma'lumoti: Navbat raqami: {q['number']}. Holati: {q['status']}."
    
        chat = model.start_chat(history=[])
        response = chat.send_message(f"System Context: {context}\n\nUser Question: {user_message}")
        return jsonify({"response": response.text})
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"AI Error: {e}")
        return jsonify({"response": "Uzr, hozir javob bera olmayman. Tizimda xatolik."})

def notification_scheduler():
    """Background task to send Telegram notifications at 1 hour, 30 min, and 10 min intervals"""
    print("⏰ Advanced Scheduler Started (1h, 30m, 10m)...")
    while True:
        try:
            # Fetch waiting queues
            queues = database.get_todays_queues()
            now = datetime.now()
            
            for q_id, q in queues.items():
                if q['status'] != 'waiting' or not q.get('date') or not q.get('time'):
                    continue
                
                phone = q['phone']
                user = database.get_user(phone)
                if not user:
                    continue
                    
                user_id = user['user_id']
                number = q['number']
                
                try:
                    appt_dt = datetime.fromisoformat(f"{q['date']}T{q['time']}")
                    time_diff = appt_dt - now
                    total_seconds = time_diff.total_seconds()
                    minutes_left = total_seconds / 60
                    
                    # Levels: 0=None, 1=1h sent, 2=30m sent, 3=10m sent
                    current_level = q.get('notification_level', 0)
                    new_level = current_level
                    msg = None
                    
                    # 1 Hour Warning (55-65 mins)
                    if 55 <= minutes_left <= 65 and current_level < 1:
                        msg = f"⏳ <b>Eslatma!</b>\n\nNavbatingizga <b>1 soat</b> qoldi.\nSana: {q['date']}\nVaqt: {q['time']}\nRaqam: {number}"
                        new_level = 1
                        
                    # 30 Min Warning (25-35 mins)
                    elif 25 <= minutes_left <= 35 and current_level < 2:
                        msg = f"⏱ <b>Yarim soat qoldi!</b>\n\nNavbatingizga <b>30 daqiqa</b> qoldi.\nManzil tomon yo'lga chiqing!"
                        new_level = 2
                        
                    # 10 Min Warning (5-15 mins)
                    elif 5 <= minutes_left <= 15 and current_level < 3:
                        msg = f"🚨 <b>Shoshiling!</b>\n\nNavbatingizga <b>10 daqiqa</b> qoldi.\nRaqam: {number}\nOperator sizni chaqirishiga oz qoldi."
                        new_level = 3
                    
                    if msg:
                        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
                        resp = requests.post(url, json={"chat_id": user_id, "text": msg, "parse_mode": "HTML"})
                        if resp.status_code == 200:
                            database.update_notification_level(q_id, new_level)
                            print(f"🔔 Notification Level {new_level} sent to {phone}")
                            
                except Exception as e:
                    print(f"Time calc error: {e}")

        except Exception as e:
            print(f"⚠️ Scheduler error: {e}")
            
        time.sleep(60) # Only check every minute

if __name__ == '__main__':
    # Start background thread
    threading.Thread(target=notification_scheduler, daemon=True).start()
    app.run(debug=False, port=5000)
