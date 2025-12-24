import sqlite3
import json

def get_db_connection():
    DB_NAME = "queue_system.db"
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

print("--- USERS TABLE ---")
conn = get_db_connection()
users = conn.execute('SELECT * FROM users').fetchall()
for u in users:
    print(dict(u))

print("\n--- QUEUES TABLE ---")
queues = conn.execute('SELECT * FROM queues ORDER BY created_at DESC LIMIT 5').fetchall()
for q in queues:
    print(dict(q))
conn.close()
