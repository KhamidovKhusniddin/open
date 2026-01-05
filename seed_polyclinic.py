import sqlite3
import uuid
import secrets
import string
import os
from datetime import datetime
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
DB_NAME = "queue_system.db"

def generate_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

def run_seed():
    print("Starting Gulbahor Polyclinic Seeding...")
    
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # 1. Create Organization
    org_id = "gulbahor_med"
    org_name = "Gulbahor Poliklinikasi"
    c.execute("INSERT OR REPLACE INTO organizations (id, name, created_at) VALUES (?, ?, ?)", 
              (org_id, org_name, datetime.now().isoformat()))
    
    # 2. Create Branch
    branch_id = "main_branch"
    c.execute("INSERT OR REPLACE INTO branches (id, org_id, name, address) VALUES (?, ?, ?, ?)",
              (branch_id, org_id, "Asosiy Bino", "Toshkent viloyati, Yangiyo'l tumani, Gulbahor shaharchasi, Sharof Rashidov ko'chasi, 2-uy"))

    # 3. Create Services (Departments)
    services = [
        ("Xalq Tabobati (Zulfiya)", 20),
        ("Terapevt (Feruza)", 15),
        ("Terapevt (Nargiza)", 15),
        ("Pediatr (Lola)", 15),
        ("Ginekolog (Dilnoza)", 20),
        ("Stomatolog (Malika)", 30),
        ("Nevropatolog (Zamira)", 20),
        ("Kardiolog (Shahlo)", 20),
        ("Endokrinolog (Ra'no)", 20),
        ("Okulist (Dilorom)", 15),
        ("LOR (Nozima)", 15),
        ("Dermatolog (Gulchehra)", 15),
        ("Xirurg (Saodat)", 20),
        ("Travmatolog (Mavluda)", 20),
        ("Onkolog (Barno)", 25),
        ("Infeksionist (Muqaddas)", 20),
        ("UZI (Mohira)", 15),
        ("EKG (Dildora)", 10),
        ("Qon Tahlili (Laboratoriya)", 10),
        ("Rentgen (Gavhar)", 15)
    ]

    service_map = {} # Name -> ID
    for name, duration in services:
        svc_id = f"svc_{secrets.token_hex(4)}"
        c.execute("INSERT OR REPLACE INTO services (id, org_id, name_uz, estimated_duration, branch_id) VALUES (?, ?, ?, ?, ?)",
                  (svc_id, org_id, name, duration, branch_id))
        service_map[name] = svc_id

    # 4. Create Staff (20 Ayol)
    staff_names = [
        "Zulfiya", "Feruza", "Nargiza", "Lola", "Dilnoza", 
        "Malika", "Zamira", "Shahlo", "Ra'no", "Dilorom",
        "Nozima", "Gulchehra", "Saodat", "Mavluda", "Barno",
        "Muqaddas", "Mohira", "Dildora", "Laborantka", "Gavhar"
    ]
    
    passwords = []
    
    for i, name in enumerate(staff_names):
        phone = f"+99899100{1000 + i}"
        username = name
        password = generate_password()
        pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        role = "staff"
        
        # Link staff to a service (roughly mapping by index or logic)
        # For simplicity, we just create them as users with 'staff' role
        # In a real app, we'd map them to specific services via the 'user_services' table if it existed,
        # but here we rely on them logging in and selecting/serving a queue.
        # Wait, the current system doesn't strictly bind staff to service in 'users' table, 
        # but queues have 'staff_id'. Let's just create the accounts.
        
        c.execute('''
            INSERT OR REPLACE INTO users (phone, user_id, username, role, password_hash, org_id, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (phone, f"staff_{i}", username, role, pw_hash, org_id, branch_id))
        
        passwords.append(f"{name} ({phone}): {password}")

    # 5. Create System Admin
    admin_pass = generate_password(12)
    admin_hash = bcrypt.generate_password_hash(admin_pass).decode('utf-8')
    admin_phone = "+998901234567"
    c.execute('''
        INSERT OR REPLACE INTO users (phone, user_id, username, role, password_hash, org_id, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (admin_phone, "sys_admin", "Admin Gulbahor", "system_admin", admin_hash, org_id, branch_id))
    
    passwords.append(f"SYSTEM ADMIN ({admin_phone}): {admin_pass}")

    conn.commit()
    conn.close()

    # Save passwords to file
    with open("passwords_gulbahor.txt", "w", encoding='utf-8') as f:
        f.write("🏥 GULBAHOR POLIKLINIKASI - XODIMLAR PAROLLARI\n")
        f.write("==============================================\n")
        f.write(f"Sana: {datetime.now()}\n\n")
        for p in passwords:
            f.write(p + "\n")
            
    print("Ma'lumotlar bazasi to'ldirildi!")
    print("Parollar 'passwords_gulbahor.txt' fayliga saqlandi.")

if __name__ == "__main__":
    run_seed()
