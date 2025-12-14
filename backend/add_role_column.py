"""Add role column to users table and set admin role for admin@autotrading.com"""
import sqlite3

def add_role_column():
    conn = sqlite3.connect('trading_maven.db')
    cursor = conn.cursor()
    
    # Check if role column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'role' not in columns:
        print("Adding 'role' column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'")
        conn.commit()
        print("Column added successfully!")
    else:
        print("'role' column already exists")
    
    # Set admin role for admin@autotrading.com
    cursor.execute("UPDATE users SET role = 'admin' WHERE email = 'admin@autotrading.com'")
    conn.commit()
    print("Set admin role for admin@autotrading.com")
    
    # Verify
    cursor.execute("SELECT id, email, username, role FROM users")
    users = cursor.fetchall()
    print("\nAll users:")
    for user in users:
        print(f"  ID: {user[0]}, Email: {user[1]}, Username: {user[2]}, Role: {user[3]}")
    
    conn.close()

if __name__ == "__main__":
    add_role_column()
