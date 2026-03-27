from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from routers import resume, interview, stats, auth
from config.database import engine, Base

# Create Tables
Base.metadata.create_all(bind=engine)

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Interview Backend", version="1.0.0")

# CORS Configuration
origins = ["*"]

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
