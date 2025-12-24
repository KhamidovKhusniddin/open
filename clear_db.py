import database

def clear_db():
    conn = database.get_db_connection()
    try:
        conn.execute('DELETE FROM queues')
        conn.commit()
        print("✅ Database cleared successfully!")
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    clear_db()
