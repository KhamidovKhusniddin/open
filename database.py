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
            created_at TEXT
        )
    ''')

    # services table
    c.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name_uz TEXT,
            name_ru TEXT,
            name_en TEXT,
            branch_id TEXT
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
        c.execute('''
            INSERT INTO queues (id, phone, number, status, date, time, staff_id, service_id, branch_id, created_at, last_notified, notification_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            queue_data['id'],
            queue_data['phone'],
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
    # Return as dict for compatibility with old code logic if needed, or list
    return {q['id']: dict(q) for q in queues} 

def get_all_queues_list():
    conn = get_db_connection()
    queues = conn.execute('SELECT * FROM queues').fetchall()
    conn.close()
    return [dict(q) for q in queues]

def update_queue_status(queue_id, status):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('UPDATE queues SET status = ? WHERE id = ?', (status, queue_id))
    conn.commit()
    conn.close()

def update_notification_level(queue_id, level):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('UPDATE queues SET notification_level = ? WHERE id = ?', (level, queue_id))
    conn.commit()
    conn.close()

# --- User Operations ---

def add_user(phone, user_id, username):
    # Normalize phone: plus sign + digits only
    phone = "+" + "".join(filter(str.isdigit, phone))
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute('INSERT OR REPLACE INTO users (phone, user_id, username, created_at) VALUES (?, ?, ?, ?)',
                  (phone, user_id, username, datetime.now().isoformat()))
        conn.commit()
    except Exception as e:
        print(f"Error adding user: {e}")
    finally:
        conn.close()

def get_user(phone):
    phone = "+" + "".join(filter(str.isdigit, phone))
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE phone = ?', (phone,)).fetchone()
    conn.close()
    return dict(user) if user else None

# --- Analytics ---

def get_admin_stats():
    conn = get_db_connection()
    
    # Total Queues Today
    today = datetime.now().strftime('%Y-%m-%d')
    total_today = conn.execute('SELECT COUNT(*) FROM queues WHERE date = ?', (today,)).fetchone()[0]
    
    # Waiting
    waiting = conn.execute('SELECT COUNT(*) FROM queues WHERE status = "waiting" AND date = ?', (today,)).fetchone()[0]
    
    # Completed
    completed = conn.execute('SELECT COUNT(*) FROM queues WHERE status = "completed" AND date = ?', (today,)).fetchone()[0]
    
    conn.close()
    return {
        "total_today": total_today,
        "waiting": waiting,
        "completed": completed
    }
