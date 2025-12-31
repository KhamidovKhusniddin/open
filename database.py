import sqlite3
from datetime import datetime
import json
import os
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "queue_system.db")

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Organizations table
    c.execute('''
        CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            license_status TEXT DEFAULT 'active',
            created_at TEXT
        )
    ''')

    # Branches table
    c.execute('''
        CREATE TABLE IF NOT EXISTS branches (
            id TEXT PRIMARY KEY,
            org_id TEXT,
            name TEXT NOT NULL,
            address TEXT,
            FOREIGN KEY (org_id) REFERENCES organizations(id)
        )
    ''')

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
            org_id TEXT,
            created_at TEXT,
            last_notified TEXT,
            notification_level INTEGER DEFAULT 0,
            FOREIGN KEY (org_id) REFERENCES organizations(id)
        )
    ''')
    
    # users table (Roles: system_admin, org_admin, staff, user)
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            phone TEXT PRIMARY KEY,
            user_id TEXT,
            username TEXT,
            role TEXT DEFAULT 'user',
            org_id TEXT,
            branch_id TEXT,
            password_hash TEXT,
            created_at TEXT,
            FOREIGN KEY (org_id) REFERENCES organizations(id)
        )
    ''')
    
    # Simple migration helper for existing structures
    try:
        c.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"')
        c.execute('ALTER TABLE users ADD COLUMN org_id TEXT')
        c.execute('ALTER TABLE users ADD COLUMN branch_id TEXT')
        c.execute('ALTER TABLE users ADD COLUMN password_hash TEXT')
    except: pass

    try:
        c.execute('ALTER TABLE queues ADD COLUMN org_id TEXT')
    except: pass

    # services table
    c.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            org_id TEXT,
            name_uz TEXT,
            name_ru TEXT,
            name_en TEXT,
            branch_id TEXT,
            estimated_duration INTEGER DEFAULT 15,
            FOREIGN KEY (org_id) REFERENCES organizations(id)
        )
    ''')
    try:
        c.execute('ALTER TABLE services ADD COLUMN org_id TEXT')
    except: pass

    conn.commit()
    conn.close()
    print("✅ Database initialized with Multi-Tenant schema")

# --- Organization Management ---

def update_organization(org_id, name):
    conn = get_db_connection()
    try:
        conn.execute('UPDATE organizations SET name = ? WHERE id = ?', (name, org_id))
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()

def get_org_services(org_id):
    conn = get_db_connection()
    services = conn.execute('SELECT * FROM services WHERE org_id = ?', (org_id,)).fetchall()
    conn.close()
    return [dict(s) for s in services]

def add_service(org_id, branch_id, name_uz, duration):
    import uuid
    svc_id = str(uuid.uuid4())[:8]
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO services (id, org_id, branch_id, name_uz, estimated_duration)
            VALUES (?, ?, ?, ?, ?)
        ''', (svc_id, org_id, branch_id, name_uz, duration))
        conn.commit()
        return svc_id
    finally:
        conn.close()

def delete_service(service_id, org_id):
    conn = get_db_connection()
    # Security: Ensure service belongs to org
    svc = conn.execute('SELECT id FROM services WHERE id = ? AND org_id = ?', (service_id, org_id)).fetchone()
    if not svc: return False
    
    conn.execute('DELETE FROM services WHERE id = ?', (service_id,))
    conn.commit()
    conn.close()
    return True

# --- Organization & Branch Management ---

def add_organization(name):
    import uuid
    org_id = str(uuid.uuid4())[:8] # Short ID for convenience
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)', 
                     (org_id, name, datetime.now().isoformat()))
        conn.commit()
        return org_id
    finally:
        conn.close()

def get_organizations():
    conn = get_db_connection()
    orgs = conn.execute('SELECT * FROM organizations').fetchall()
    conn.close()
    return [dict(o) for o in orgs]

def add_branch(org_id, name, address):
    import uuid
    branch_id = str(uuid.uuid4())[:8]
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO branches (id, org_id, name, address) VALUES (?, ?, ?, ?)', 
                     (branch_id, org_id, name, address))
        conn.commit()
        return branch_id
    finally:
        conn.close()

def get_branches(org_id=None):
    conn = get_db_connection()
    if org_id:
        branches = conn.execute('SELECT * FROM branches WHERE org_id = ?', (org_id,)).fetchall()
    else:
        branches = conn.execute('SELECT * FROM branches').fetchall()
    conn.close()
    return [dict(b) for b in branches]


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

def get_todays_queues(org_id=None):
    today = datetime.now().strftime('%Y-%m-%d')
    conn = get_db_connection()
    query = 'SELECT * FROM queues WHERE (date = ? OR status = "waiting")'
    params = [today]
    if org_id:
        query += ' AND org_id = ?'
        params.append(org_id)
        
    queues = conn.execute(query, params).fetchall()
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

def add_user(phone, user_id, username, role='user', password_hash=None, org_id=None, branch_id=None):
    phone = normalize_phone(phone)
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO users (phone, user_id, username, role, password_hash, org_id, branch_id, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET 
                user_id=excluded.user_id, 
                username=excluded.username, 
                role=COALESCE(excluded.role, users.role),
                password_hash=COALESCE(excluded.password_hash, users.password_hash),
                org_id=COALESCE(excluded.org_id, users.org_id),
                branch_id=COALESCE(excluded.branch_id, users.branch_id)
        ''', (phone, user_id, username, role, password_hash, org_id, branch_id, datetime.now().isoformat()))
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
    # Check for admin or org_admin or staff roles
    user = conn.execute('SELECT * FROM users WHERE phone = ? AND role IN ("admin", "system_admin", "org_admin", "staff")', (phone,)).fetchone()
    conn.close()
    return dict(user) if user else None

def check_system_admin_exists():
    conn = get_db_connection()
    # Check if ANY user with system_admin role exists
    count = conn.execute('SELECT COUNT(*) FROM users WHERE role = "system_admin"').fetchone()[0]
    conn.close()
    return count > 0

# --- Analytics ---

def get_admin_stats(org_id=None):
    conn = get_db_connection()
    today = datetime.now().strftime('%Y-%m-%d')
    
    where_clause = ' WHERE date = ?'
    params = [today]
    if org_id:
        where_clause += ' AND org_id = ?'
        params.append(org_id)
        
    stats = {
        "total_today": conn.execute(f'SELECT COUNT(*) FROM queues {where_clause}', params).fetchone()[0],
        "waiting": conn.execute(f'SELECT COUNT(*) FROM queues {where_clause} AND status = "waiting"', params).fetchone()[0],
        "completed": conn.execute(f'SELECT COUNT(*) FROM queues {where_clause} AND status = "completed"', params).fetchone()[0],
        "total_users": conn.execute('SELECT COUNT(*) FROM users').fetchone()[0] # Global for system_admin usually, filter if needed
    }
    
    if org_id:
        stats["total_users"] = conn.execute('SELECT COUNT(*) FROM users WHERE org_id = ?', (org_id,)).fetchone()[0]
        
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

def get_analytics_data(org_id=None):
    conn = get_db_connection()
    today = datetime.now().strftime('%Y-%m-%d')
    try:
        # 1. Hourly traffic (Today)
        query_hourly = '''
            SELECT strftime('%H', created_at) as hour, COUNT(*) as count 
            FROM queues 
            WHERE date = ? 
        '''
        params_hourly = [today]
        if org_id:
            query_hourly += ' AND org_id = ?'
            params_hourly.append(org_id)
            
        query_hourly += ' GROUP BY hour'
        
        hourly_data = conn.execute(query_hourly, params_hourly).fetchall()
        
        # 2. Service distribution
        query_services = '''
            SELECT s.name_uz, COUNT(q.id) as count 
            FROM services s
            LEFT JOIN queues q ON s.id = q.service_id
            WHERE (q.date = ? OR q.date IS NULL)
        '''
        params_services = [today]
        if org_id:
            query_services += ' AND s.org_id = ?'
            params_services.append(org_id)
            
        query_services += ' GROUP BY s.id HAVING count > 0'
        
        service_data = conn.execute(query_services, params_services).fetchall()
        
        return {
            "hourly": {row['hour']: row['count'] for row in hourly_data},
            "services": {row['name_uz']: row['count'] for row in service_data}
        }
    finally:
        conn.close()
