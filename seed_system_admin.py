import database
import os
from flask_bcrypt import Bcrypt
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
bcrypt = Bcrypt(app)

def seed_admin():
    database.init_db()
    
    phone = input("Yangi System Admin telefonini kiriting (+998XXXXXXXXX): ").strip()
    password = input("Yangi System Admin parolini kiriting: ").strip()
    
    if not phone or not password:
        print("Xatolik: Telefon va parol bo'sh bo'lmasligi kerak.")
        return

    pwd_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # role='system_admin'
    database.add_user(phone, None, "SuperAdmin", "system_admin", pwd_hash)
    
    print(f"\n✅ Muvaffaqiyatli! Tizimga kirish uchun:")
    print(f"Telefon: {phone}")
    print(f"Parol: {password}")
    print(f"Rol: system_admin")

if __name__ == "__main__":
    seed_admin()
