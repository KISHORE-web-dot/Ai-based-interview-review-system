from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from models.db_models import Interview, Feedback
from models.schemas import (
    InterviewStartRequest, 
    InterviewSession, 
    AnswerRequest, 
    FeedbackResponse, 
    FinalFeedbackRequest, 
    FinalFeedbackResponse
)
from services.ai_service import generate_questions, analyze_answer, generate_final_feedback
import uuid

router = APIRouter()

@router.post("/start", response_model=InterviewSession)
async def start_interview(request: InterviewStartRequest, db: Session = Depends(get_db)):
    questions = generate_questions(request.resume_text, request.type, request.difficulty)
    session_id = str(uuid.uuid4())
    
    # Create Interview Record
    new_interview = Interview(
        id=session_id,
        resume_id=request.resume_id, # Assuming passed or null
        type=request.type,
        difficulty=request.difficulty
    )
    db.add(new_interview)
    db.commit()
    
    return {
        "session_id": session_id,
        "questions": questions
    }

@router.post("/analyze-answer", response_model=FeedbackResponse)
async def analyze_interview_answer(request: AnswerRequest):
    analysis = analyze_answer(request.question, request.answer)
    return analysis

@router.post("/end", response_model=FinalFeedbackResponse)
async def end_interview(request: FinalFeedbackRequest, db: Session = Depends(get_db)):
    try:
        # Convert Pydantic models to dicts for AI service
        qa_list_dicts = [qa.dict() for qa in request.qa_list]
        
        feedback_data = generate_final_feedback(qa_list_dicts)
        
        # Process body language if frames are provided
        if getattr(request, 'frames', None):
            from services.ai_service import analyze_body_language
            body_language_data = analyze_body_language(request.frames)
            if body_language_data:
                feedback_data["body_language_score"] = body_language_data.get("body_language_score")
                feedback_data["body_language_feedback"] = body_language_data.get("body_language_feedback")
        
        # Save Feedback to DB
        scores = feedback_data.get("scores", {})
        
        # If scores not in AI response, extract from overall_score
        if not scores:
            overall = feedback_data.get("overall_score", 50)
            scores = {
                "Confidence": overall,
                "Communication": overall,
                "Technical Knowledge": overall,
                "Stress Handling": overall
            }
        
        new_feedback = Feedback(
            interview_id=request.session_id,
            confidence_score=scores.get("Confidence", feedback_data.get("overall_score", 50)),
            communication_score=scores.get("Communication", feedback_data.get("overall_score", 50)),
            technical_score=scores.get("Technical Knowledge", feedback_data.get("overall_score", 50)),
            stress_handling_score=scores.get("Stress Handling", feedback_data.get("overall_score", 50)),
            analysis_data=str(feedback_data)  # Store as JSON string
        )
        
        db.add(new_feedback)
        db.commit()
        
        return feedback_data
        
    except Exception as e:
        print(f"Error in end_interview: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")
