import sqlite3

# Connect to database
conn = sqlite3.connect('trading_maven.db')
cursor = conn.cursor()

# Update the subscription_tier to uppercase 'PRO'
cursor.execute("UPDATE users SET subscription_tier = 'PRO'")
conn.commit()

# Check the result
cursor.execute("SELECT email, username, subscription_tier FROM users")
users = cursor.fetchall()
print(f"Total users: {len(users)}")
for user in users:
    print(f"Email: {user[0]}, Username: {user[1]}, Tier: {user[2]}")

conn.close()
print("\n✅ Database fixed!")
