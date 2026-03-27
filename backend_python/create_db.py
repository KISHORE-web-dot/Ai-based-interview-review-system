import sqlalchemy
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

# Parse the URL to get credentials, but connect to 'mysql' system db first to create the target db
# This is a bit hacky, but safer than regex for now given the @ in password
# Expected format: mysql+pymysql://USER:PASSWORD@HOST/DB_NAME

def create_database():
    try:
        # Hardcoded for the immediate user request/fix
        # Note: In a robust app, we'd parse the env var properly or use separate env vars
        # Installing pymysql is required
        
        # User provided: root : root@1234
        # We need to URL encode the password because it contains '@'
        password = quote_plus("root@1234")
        
        # Connect to MySQL server (no specific DB)
        # Using f-string for URL construction
        engine_url = f"mysql+pymysql://root:{password}@localhost"
        
        # Create engine with echo=True for debugging
        engine = create_engine(engine_url, echo=True)
        
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text("SHOW DATABASES LIKE 'interview_db'"))
            if not result.fetchone():
                print("Database 'interview_db' not found. Creating...")
                conn.execute(text("CREATE DATABASE interview_db"))
                print("Database 'interview_db' created successfully!")
            else:
                print("Database 'interview_db' already exists.")
                
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
