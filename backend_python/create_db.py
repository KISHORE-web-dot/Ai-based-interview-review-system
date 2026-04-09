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
        # Require DATABASE_URL instead of hardcoding
        raw_url = os.getenv("DATABASE_URL")
        if not raw_url:
            raise ValueError("DATABASE_URL must be set in the environment variables.")
            
        # Extract engine_url from the full DATABASE_URL without the DB name
        if raw_url.count('/') > 2:
            parts = raw_url.rsplit('/', 1)
            engine_url = parts[0]
            db_name = parts[1]
        else:
            raise ValueError("Invalid DATABASE_URL format")
        
        
        # Create engine with echo=True for debugging
        engine = create_engine(engine_url, echo=True)
        
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SHOW DATABASES LIKE '{db_name}'"))
            if not result.fetchone():
                print(f"Database '{db_name}' not found. Creating...")
                conn.execute(text(f"CREATE DATABASE {db_name}"))
                print(f"Database '{db_name}' created successfully!")
            else:
                print(f"Database '{db_name}' already exists.")
                
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
