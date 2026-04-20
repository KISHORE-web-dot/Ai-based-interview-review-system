from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Format: mysql+pymysql://user:password@host/db_name
raw_url = os.getenv("DATABASE_URL")
if not raw_url:
    print("⚠️  DATABASE_URL not set — falling back to local SQLite database.")
    raw_url = "sqlite:///./interview_app.db"

if raw_url.startswith("mysql://"):
    raw_url = raw_url.replace("mysql://", "mysql+pymysql://", 1)

DATABASE_URL = raw_url

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
