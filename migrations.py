import sqlite3
from flask_bcrypt import Bcrypt
from flask import Flask
import database
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
bcrypt = Bcrypt(app)

def run_migrations():
    print("🚀 Migratsiya boshlandi...")
    
    # 1. Initialize DB structure
    database.init_db()
    
    # 2. Add default admin if not exists
    admin_phone = "+998990000000" # Example admin phone
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    hashed_pw = bcrypt.generate_password_hash(admin_password).decode('utf-8')
    
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    # Check if admin exists
    cursor.execute("SELECT * FROM users WHERE role = 'admin'")
    admin = cursor.fetchone()
    
    if not admin:
        print(f"👤 Admin yaratilmoqda: {admin_phone}")
        database.add_user(
            phone=admin_phone,
            user_id="admin_internal",
            username="SuperAdmin",
            role="admin",
            password_hash=hashed_pw
        )
        print("✅ Admin muvaffaqiyatli yaratildi.")
    else:
        print("ℹ️ Admin allaqachon mavjud.")
        # Update password if needed
        cursor.execute("UPDATE users SET password_hash = ? WHERE role = 'admin'", (hashed_pw,))
        conn.commit()
        print("✅ Admin paroli yangilandi.")
        
    conn.close()
    print("✨ Migratsiya yakunlandi.")

if __name__ == "__main__":
    run_migrations()
