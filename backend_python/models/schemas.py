from pydantic import BaseModel
from typing import List, Optional

class ResumeResponse(BaseModel):
    text: str
    filename: str

class InterviewStartRequest(BaseModel):
    resume_text: str
    resume_id: Optional[str] = None
    type: str = "HR" # HR, Technical, Manager
    difficulty: str = "Medium"
    language: str = "English"

class Question(BaseModel):
    id: int
    text: str
    
class InterviewSession(BaseModel):
    session_id: str
    questions: List[Question]

class AnswerRequest(BaseModel):
    question: str
    answer: str

class FeedbackResponse(BaseModel):
    feedback: str
    score: int
    suggestions: List[str]

class QA(BaseModel):
    question: str
    answer: str
    analysis: Optional[dict] = None  # Optional analysis from AI
    

class FinalFeedbackRequest(BaseModel):
    session_id: str
    qa_list: List[QA]
    frames: Optional[List[str]] = []
    
class FinalFeedbackResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    next_steps: List[str]
    overall_score: int
    detailed_analysis: str
    body_language_score: Optional[int] = None
    body_language_feedback: Optional[str] = None
