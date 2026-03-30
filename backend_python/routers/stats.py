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
    
    # Get the Last 5 Feedbacks for a highly responsive moving average
    recent_feedbacks = db.query(Feedback).order_by(Feedback.id.desc()).limit(5).all()
    
    # Format response with auto-scaling (convert 0-10 to 0-100 percentage)
    def format_score(score):
        if not score: return 0
        val = float(score)
        return int(val * 10) if val <= 10 else int(val)
        
    if not recent_feedbacks:
        return {
            "totalInterviews": total_interviews,
            "scores": { "confidence": 0, "communication": 0, "technical": 0, "stress": 0 },
            "trends": { "confidence": "+0%", "communication": "+0%" }
        }
        
    # Calculate responsive averages
    avg_conf = sum(f.confidence_score or 0 for f in recent_feedbacks) / len(recent_feedbacks)
    avg_comm = sum(f.communication_score or 0 for f in recent_feedbacks) / len(recent_feedbacks)
    avg_tech = sum(f.technical_score or 0 for f in recent_feedbacks) / len(recent_feedbacks)
    avg_stress = sum(f.stress_handling_score or 0 for f in recent_feedbacks) / len(recent_feedbacks)

    return {
        "totalInterviews": total_interviews,
        "scores": {
            "confidence": format_score(avg_conf),
            "communication": format_score(avg_comm),
            "technical": format_score(avg_tech),
            "stress": format_score(avg_stress)
        },
        # Mock trend for now (could be calculated from last 2 vs previous)
        "trends": {
            "confidence": "+2%",
            "communication": "+5%"
        }
    }
