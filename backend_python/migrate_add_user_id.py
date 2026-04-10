"""
Run this script once to add user_id column to the Railway MySQL interviews table.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

print(f"Connecting to: {DATABASE_URL[:40]}...")
engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    # Check if column already exists
    result = conn.execute(text("SHOW COLUMNS FROM interviews LIKE 'user_id'"))
    exists = result.fetchone()
    if exists:
        print("user_id column already exists — no action needed.")
    else:
        conn.execute(text("ALTER TABLE interviews ADD COLUMN user_id INTEGER;"))
        print("✅ user_id column added to interviews table successfully!")
