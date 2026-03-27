from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from config.database import get_db
from models.db_models import Interview, Feedback

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    # Total Interviews
    total_interviews = db.query(Interview).count()
    
    # Average Scores
    avg_scores = db.query(
        func.avg(Feedback.confidence_score).label("confidence"),
        func.avg(Feedback.communication_score).label("communication"),
        func.avg(Feedback.technical_score).label("technical"),
        func.avg(Feedback.stress_handling_score).label("stress")
    ).first()
    
    # Format response (handle None if no data)
    def format_score(score):
        return int(score) if score else 0
        
    return {
        "totalInterviews": total_interviews,
        "scores": {
            "confidence": format_score(avg_scores.confidence),
            "communication": format_score(avg_scores.communication),
            "technical": format_score(avg_scores.technical),
            "stress": format_score(avg_scores.stress)
        },
        # Mock trend for now (could be calculated from last 2 vs previous)
        "trends": {
            "confidence": "+2%",
            "communication": "+5%"
        }
    }
