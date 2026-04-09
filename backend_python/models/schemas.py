from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class ResumeResponse(BaseModel):
    text: str
    filename: str

class InterviewStartRequest(BaseModel):
    resume_text: str = Field(..., max_length=50000)
    resume_id: Optional[str] = Field(None, max_length=36)
    type: str = Field("HR", max_length=50) # HR, Technical, Manager
    difficulty: str = Field("Medium", max_length=20)
    language: str = Field("English", max_length=50)

class Question(BaseModel):
    id: int
    text: str
    interviewer: Optional[str] = None
    timeLimit: Optional[int] = None
    
class InterviewSession(BaseModel):
    session_id: str
    questions: List[Question]

class AnswerRequest(BaseModel):
    question: str = Field(..., max_length=5000)
    answer: str = Field(..., max_length=15000)

class FeedbackResponse(BaseModel):
    feedback: str
    score: int
    suggestions: List[str]

class QA(BaseModel):
    question: str = Field(..., max_length=5000)
    answer: str = Field(..., max_length=15000)
    analysis: Optional[dict] = None  # Optional analysis from AI
    

class FinalFeedbackRequest(BaseModel):
    session_id: str = Field(..., max_length=36)
    qa_list: List[QA] = Field(..., max_length=50)
    frames: Optional[List[str]] = Field([], max_length=100)
    
class FinalFeedbackResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    next_steps: List[str]
    scores: Dict[str, int]
    overall_score: int
    detailed_analysis: str
    body_language_score: Optional[int] = None
    body_language_feedback: Optional[str] = None
