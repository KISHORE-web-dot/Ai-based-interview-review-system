from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from config.rate_limit import limiter
from routers import resume, interview, stats, auth
from config.database import engine, Base

# Create Tables
Base.metadata.create_all(bind=engine)

# Safe migration: add user_id column to interviews if it doesn't exist
def run_migrations():
    from sqlalchemy import text, inspect
    try:
        with engine.begin() as conn:
            inspector = inspect(engine)
            existing_cols = [c['name'] for c in inspector.get_columns('interviews')]
            if 'user_id' not in existing_cols:
                conn.execute(text("ALTER TABLE interviews ADD COLUMN user_id INTEGER;"))
                print("✅ Migration: user_id column added to interviews table.")
            else:
                print("✅ Migration: user_id column already exists, skipping.")
    except Exception as e:
        print(f"⚠️  Migration warning (non-fatal): {e}")

run_migrations()

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Interview Backend", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

MAX_BODY_SIZE = 5 * 1024 * 1024  # 5 MB limit

@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": f"Payload Too Large. Maximum allowed size is {MAX_BODY_SIZE / (1024 * 1024)}MB"}
            )
    return await call_next(request)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ai-based-interview-review-system.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(stats.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/")
async def root():
    return {"status": "Active", "message": "AI Interview Preparation Backend is Running (Python)"}

@app.get("/api/health")
async def health_check():
    return {"status": "OK"}



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
