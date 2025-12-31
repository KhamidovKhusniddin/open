import sqlite3
import uuid
from datetime import datetime
import database

def migrate():
    print("🚀 Starting migration of mock data...")
    conn = database.get_db_connection()
    c = conn.cursor()

    # Data from database.js
    orgs = [
        {"id": "org_001", "name": "Aloqabank", "type": "bank", "icon": "🏦"},
        {"id": "org_002", "name": "Shifokor Plus", "type": "clinic", "icon": "🏥"},
        {"id": "org_003", "name": "Yunusobod Soliq Inspeksiyasi", "type": "tax", "icon": "💼"},
        {"id": "org_004", "name": "IIV Migratsiya Xizmati", "type": "passport", "icon": "📋"}
    ]

    services_map = {
        "bank": [
            {"name": "Kredit Bo'limi", "duration": 30},
            {"name": "Kassa", "duration": 10},
            {"name": "Valyuta Ayirboshlash", "duration": 5},
            {"name": "Plastik Kartalar", "duration": 15}
        ],
        "clinic": [
            {"name": "Terapevt", "duration": 20},
            {"name": "Jarroh", "duration": 25},
            {"name": "Ko'z Shifokori", "duration": 15},
            {"name": "Laboratoriya", "duration": 10}
        ],
        "tax": [
            {"name": "Jismoniy Shaxslar", "duration": 20},
            {"name": "Yuridik Shaxslar", "duration": 30},
            {"name": "Deklaratsiya", "duration": 25},
            {"name": "Maslahat Xizmati", "duration": 15}
        ],
        "passport": [
            {"name": "Zagran Pasport", "duration": 20},
            {"name": "ID Karta", "duration": 15},
            {"name": "Propiska", "duration": 15},
            {"name": "Fuqarolik", "duration": 30}
        ]
    }

    try:
        # Clear existing (optional, but good for clean state if empty)
        # c.execute("DELETE FROM organizations")
        # c.execute("DELETE FROM branches")
        c.execute("DROP TABLE IF EXISTS services") # Force schema update
        
        # Ensure services table is created with correct schema
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

        for org in orgs:
            # 1. Insert Org
            print(f"Adding Org: {org['name']}")
            c.execute("INSERT OR REPLACE INTO organizations (id, name, created_at) VALUES (?, ?, ?)",
                      (org['id'], org['name'], datetime.now().isoformat()))
            
            # 2. Insert Branch
            branch_id = f"branch_{org['id']}"
            c.execute("INSERT OR REPLACE INTO branches (id, org_id, name, address) VALUES (?, ?, ?, ?)",
                      (branch_id, org['id'], f"{org['name']} - Bosh Ofis", "Toshkent sh."))

            # 3. Insert Services
            for svc in services_map[org['type']]:
                svc_id = str(uuid.uuid4())[:8]
                c.execute('''
                    INSERT INTO services (id, org_id, branch_id, name_uz, estimated_duration)
                    VALUES (?, ?, ?, ?, ?)
                ''', (svc_id, org['id'], branch_id, svc['name'], svc['duration']))

        conn.commit()
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
