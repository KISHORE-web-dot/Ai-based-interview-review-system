from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
from config.database import get_db
from models.db_models import Interview, Feedback
from services.ai_service import generate_trend_analysis

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    # Total Interviews
    total_interviews = db.query(Interview).count()
    
    # Get the Last 5 Feedbacks for a highly responsive moving average
    recent_feedbacks = db.query(Feedback).order_by(Feedback.id.desc()).limit(5).all()
    
    # Format response with auto-scaling (convert 0-10 to 0-100 percentage)
    def scale_score(score):
        if not score: return 0
        val = float(score)
        return val * 10 if val <= 10 else val
        
    if not recent_feedbacks:
        return {
            "totalInterviews": total_interviews,
            "scores": { "confidence": 0, "communication": 0, "technical": 0, "stress": 0 },
            "trends": { "confidence": "+0%", "communication": "+0%" }
        }
        
    # Calculate responsive averages by scaling individually first
    avg_conf = sum(scale_score(f.confidence_score) for f in recent_feedbacks) / len(recent_feedbacks)
    avg_comm = sum(scale_score(f.communication_score) for f in recent_feedbacks) / len(recent_feedbacks)
    avg_tech = sum(scale_score(f.technical_score) for f in recent_feedbacks) / len(recent_feedbacks)
    avg_stress = sum(scale_score(f.stress_handling_score) for f in recent_feedbacks) / len(recent_feedbacks)

    return {
        "totalInterviews": total_interviews,
        "scores": {
            "confidence": int(avg_conf),
            "communication": int(avg_comm),
            "technical": int(avg_tech),
            "stress": int(avg_stress)
        },
        # Mock trend for now (could be calculated from last 2 vs previous)
        "trends": {
            "confidence": "+2%",
            "communication": "+5%"
        }
    }

@router.get("/analyze")
async def analyze_dashboard_performance(db: Session = Depends(get_db)):
    """Fetch recent feedbacks and generate an AI agent summary of the user's performance."""
    # Get last 4 feedbacks
    recent_feedbacks = db.query(Feedback).order_by(Feedback.id.desc()).limit(4).all()
    
    if not recent_feedbacks:
        return {"analysis": "Take a few interviews first so I can analyze your unique strengths and growth!"}
        
    # Extract only essential JSON tracking datums to prevent token bloat
    trimmed_data = []
    for f in recent_feedbacks:
        try:
            raw = f.analysis_data
            parsed = json.loads(raw) if isinstance(raw, str) else raw
            trimmed_data.append({
                "date": f.created_at.strftime("%Y-%m-%d"),
                "scores": parsed.get("scores", {}),
                "weaknesses": parsed.get("weaknesses", [])
            })
        except:
            pass
            
    summary = generate_trend_analysis(trimmed_data)
    
    return {"analysis": summary}
