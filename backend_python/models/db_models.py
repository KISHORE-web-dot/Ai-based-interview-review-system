from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(36), primary_key=True, index=True) # UUID
    resume_id = Column(String(36))
    type = Column(String(50))
    difficulty = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    feedback = relationship("Feedback", back_populates="interview", uselist=False)

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(String(36), ForeignKey("interviews.id"))
    
    # Scores
    confidence_score = Column(Float)
    communication_score = Column(Float)
    technical_score = Column(Float)
    stress_handling_score = Column(Float)
    
    # Detailed Analysis (Stored as JSON)
    analysis_data = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    interview = relationship("Interview", back_populates="feedback")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
