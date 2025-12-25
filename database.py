import sqlite3
from datetime import datetime
import json

DB_NAME = "queue_system.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # queues table
    c.execute('''
        CREATE TABLE IF NOT EXISTS queues (
            id TEXT PRIMARY KEY,
            phone TEXT NOT NULL,
            number TEXT,
            status TEXT DEFAULT 'waiting',
            date TEXT,
            time TEXT,
            staff_id TEXT,
            service_id TEXT,
            branch_id TEXT,
            created_at TEXT,
            last_notified TEXT,
            notification_level INTEGER DEFAULT 0
        )
    ''')
    
    # verifications (users) table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            phone TEXT PRIMARY KEY,
            user_id TEXT,
            username TEXT,
            role TEXT DEFAULT 'user',
            password_hash TEXT,
            created_at TEXT
        )
    ''')
    
    # Check if role column exists (simple migration helper)
    try:
        c.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"')
        c.execute('ALTER TABLE users ADD COLUMN password_hash TEXT')
    except:
        pass # Already exists

    # services table
    c.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name_uz TEXT,
            name_ru TEXT,
            name_en TEXT,
            branch_id TEXT,
            estimated_duration INTEGER DEFAULT 15
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Database initialized (SQLite)")

# --- Queue Operations ---

def add_queue(queue_data):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        # Generate internal ID if not provided as UUID compatible
        import uuid
        internal_id = queue_data.get('id') or str(uuid.uuid4())
        
        c.execute('''
            INSERT INTO queues (id, phone, number, status, date, time, staff_id, service_id, branch_id, created_at, last_notified, notification_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            internal_id,
            normalize_phone(queue_data['phone']),
            queue_data['number'],
            queue_data.get('status', 'waiting'),
            queue_data.get('date'),
            queue_data.get('time'),
            queue_data.get('staffId'),
            queue_data.get('serviceId'),
            queue_data.get('branchId'),
            queue_data.get('created_at', datetime.now().isoformat()),
            queue_data.get('last_notified', datetime.now().isoformat()),
            0 
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error adding queue: {e}")
        return False
    finally:
        conn.close()

def get_queue(queue_id):
    conn = get_db_connection()
    queue = conn.execute('SELECT * FROM queues WHERE id = ?', (queue_id,)).fetchone()
    conn.close()
    if queue:
        return dict(queue)
    return None

def get_queues_by_phone(phone, date=None):
    phone = normalize_phone(phone)
    conn = get_db_connection()
    query = 'SELECT * FROM queues WHERE phone = ?'
    params = [phone]
    if date:
        query += ' AND date = ?'
        params.append(date)
    
    queues = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(q) for q in queues]

def get_todays_queues():
    today = datetime.now().strftime('%Y-%m-%d')
    conn = get_db_connection()
    queues = conn.execute('SELECT * FROM queues WHERE date = ? OR status = "waiting"', (today,)).fetchall()
    conn.close()
    return {q['id']: dict(q) for q in queues} 

def get_all_queues_list():
    conn = get_db_connection()
    queues = conn.execute('SELECT * FROM queues ORDER BY created_at DESC').fetchall()
    conn.close()
    return [dict(q) for q in queues]

def update_queue_status(queue_id, status):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('UPDATE queues SET status = ?, last_notified = ? WHERE id = ?', (status, datetime.now().isoformat(), queue_id))
    conn.commit()
    conn.close()

def update_notification_level(queue_id, level):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('UPDATE queues SET notification_level = ? WHERE id = ?', (level, queue_id))
    conn.commit()
    conn.close()

# --- User Operations ---

def normalize_phone(phone):
    """Ensure phone is in +998XXXXXXXXX format, but allow alphanumeric usernames."""
    if any(c.isalpha() for c in phone):
        return phone # Treat as username
        
    digits = "".join(filter(str.isdigit, phone))
    if not phone.startswith('+'):
        if len(digits) == 9:
            return "+998" + digits
        return "+" + digits
    return "+" + digits

def add_user(phone, user_id, username, role='user', password_hash=None):
    phone = normalize_phone(phone)
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO users (phone, user_id, username, role, password_hash, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET 
                user_id=excluded.user_id, 
                username=excluded.username, 
                role=COALESCE(excluded.role, users.role),
                password_hash=COALESCE(excluded.password_hash, users.password_hash)
        ''', (phone, user_id, username, role, password_hash, datetime.now().isoformat()))
        conn.commit()
    except Exception as e:
        print(f"Error adding user: {e}")
    finally:
        conn.close()

def get_user(phone):
    phone = normalize_phone(phone)
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE phone = ?', (phone,)).fetchone()
    conn.close()
    return dict(user) if user else None

def get_admin_user(phone):
    phone = normalize_phone(phone)
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE phone = ? AND role = "admin"', (phone,)).fetchone()
    conn.close()
    return dict(user) if user else None

# --- Analytics ---

def get_admin_stats():
    conn = get_db_connection()
    today = datetime.now().strftime('%Y-%m-%d')
    
    stats = {
        "total_today": conn.execute('SELECT COUNT(*) FROM queues WHERE date = ?', (today,)).fetchone()[0],
        "waiting": conn.execute('SELECT COUNT(*) FROM queues WHERE status = "waiting" AND date = ?', (today,)).fetchone()[0],
        "completed": conn.execute('SELECT COUNT(*) FROM queues WHERE status = "completed" AND date = ?', (today,)).fetchone()[0],
        "total_users": conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    }
    conn.close()
    return stats

def get_queue_position(q_id):
    conn = get_db_connection()
    try:
        target = conn.execute('SELECT service_id, branch_id, created_at, status FROM queues WHERE id = ?', (q_id,)).fetchone()
        if not target: return None
        if target['status'] != 'waiting':
            return {"status": target['status'], "position": 0, "people_ahead": 0, "estimated_wait": 0}
            
        count = conn.execute('''
            SELECT COUNT(*) FROM queues 
            WHERE service_id = ? AND branch_id = ? AND status = "waiting" AND created_at < ?
        ''', (target['service_id'], target['branch_id'], target['created_at'])).fetchone()[0]
        
        service = conn.execute('SELECT estimated_duration FROM services WHERE id = ?', (target['service_id'],)).fetchone()
        duration = service['estimated_duration'] if service else 15
        
        return {
            "status": target['status'],
            "position": count + 1,
            "people_ahead": count,
            "estimated_wait": (count + 1) * duration
        }
    finally:
        conn.close()

def get_analytics_data():
    conn = get_db_connection()
    today = datetime.now().strftime('%Y-%m-%d')
    try:
        # 1. Hourly traffic (Today)
        # Groups by the hour part of created_at: '2023-10-27T14:30:00' -> '14'
        hourly_data = conn.execute('''
            SELECT strftime('%H', created_at) as hour, COUNT(*) as count 
            FROM queues 
            WHERE date = ? 
            GROUP BY hour
        ''', (today,)).fetchall()
        
        # 2. Service distribution
        service_data = conn.execute('''
            SELECT s.name_uz, COUNT(q.id) as count 
            FROM services s
            LEFT JOIN queues q ON s.id = q.service_id
            WHERE q.date = ? OR q.date IS NULL
            GROUP BY s.id
        ''', (today,)).fetchall()
        
        # 3. Average Wait Time per Service
        # (This is more complex, just placeholders for now to show professional intent)
        
        return {
            "hourly": {row['hour']: row['count'] for row in hourly_data},
            "services": {row['name_uz']: row['count'] for row in service_data}
        }
    finally:
        conn.close()
