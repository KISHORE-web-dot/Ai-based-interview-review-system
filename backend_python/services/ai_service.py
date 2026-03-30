import os
from google import genai
import json
import base64
import uuid
from dotenv import load_dotenv
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

# Ensure API key is present
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file. Please set it to use the AI service.")

client = genai.Client(api_key=API_KEY)

def generate_questions(resume_text: str, type: str, difficulty: str) -> list:
    """Generate interview questions customized by type"""
    
    session_uuid = str(uuid.uuid4())
    randomness_directive = f"CRITICAL INSTRUCTION: Ensure these questions are highly distinct, unique, and unpredictable. Do NOT use generic or repeated question templates. Random Session Hash: {session_uuid}"
    
    # Type-specific prompts
    if type.lower() == 'voice':
        prompt = f"""
        Generate 5-6 friendly, conversational interview questions for a 1-on-1 voice interview.
        
        Resume: {resume_text[:2000]}
        Difficulty: {difficulty}
        
        Focus on:
        - Personal background and motivation
        - Soft skills (communication, teamwork, adaptability)
        - Career goals and aspirations
        - Behavioral scenarios (use STAR method)
        
        Tone: Warm, supportive, encouraging
        
        {randomness_directive}
        
        Return ONLY a JSON array of question strings: ["Question 1", "Question 2", ...]
        """
        
    elif type.lower() == 'panel':
        prompt = f"""
        Generate 6-9 interview questions for a panel interview with 3 interviewers.
        
        Resume: {resume_text[:2000]}
        Difficulty: {difficulty}
        
        Distribute questions across three interviewers:
        
        HR Manager (2-3 questions):
        - Team dynamics and culture fit
        - Conflict resolution scenarios
        - Work-life balance priorities
        
        Technical Lead (2-3 questions):
        - Role-specific technical skills
        - Problem-solving approach
        - Past project experience
        
        Department Head (2-3 questions):
        - Long-term vision and career goals
        - Leadership potential
        - Strategic thinking
        
        {randomness_directive}
        
        Return JSON array with interviewer assignments:
        [
          {{"interviewer": "HR Manager", "question": "..."}},
          {{"interviewer": "Technical Lead", "question": "..."}},
          {{"interviewer": "Department Head", "question": "..."}}
        ]
        """
        
    elif type.lower() == 'stress':
        prompt = f"""
        Generate 7-10 challenging, high-pressure interview questions for stress practice.
        
        Resume: {resume_text[:2000]}
        Difficulty: {difficulty}
        
        Create questions that:
        - Test rapid decision-making
        - Present ambiguous or multi-layered problems
        - Require time-constrained explanations
        - Include unexpected "what if" situations
        - Are designed to test composure under pressure
        - Unconventional logic puzzles or situational curveballs
        
        Include time limits (15-45 seconds) for each question.
        
        {randomness_directive}
        
        Return JSON array:
        [
          {{"question": "...", "timeLimit": 30}},
          {{"question": "...", "timeLimit": 45}}
        ]
        """
    else:
        # Default fallback
        prompt = f"""
        Generate 5 interview questions for a {type} role with {difficulty} difficulty based on this resume:
        {resume_text[:2000]}
        
        Return ONLY a JSON array of strings: ["Question 1", "Question 2"]
        """
    
    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-flash', contents=prompt
        )
        # cleanup response to ensure it's valid json
        text = response.text.replace("```json", "").replace("```", "").strip()
        questions_data = json.loads(text)
        
        # Format based on type
        if type.lower() == 'panel':
            # Panel returns objects with interviewer and question
            return [{"id": i+1, "text": q["question"], "interviewer": q.get("interviewer", "Interviewer")} 
                    for i, q in enumerate(questions_data)]
        elif type.lower() == 'stress':
            # Stress returns objects with question and timeLimit
            return [{"id": i+1, "text": q["question"], "timeLimit": q.get("timeLimit", 30)} 
                    for i, q in enumerate(questions_data)]
        else:
            # Voice and default return simple strings
            return [{"id": i+1, "text": q} for i, q in enumerate(questions_data)]
            
    except Exception as e:
        print(f"AI Error: {e}")
        # Type-specific fallback questions
        if type.lower() == 'voice':
            return [
                {"id": 1, "text": "Tell me about yourself and your background."},
                {"id": 2, "text": "Why are you interested in this position?"},
                {"id": 3, "text": "What are your greatest strengths?"}
            ]
        elif type.lower() == 'panel':
            return [
                {"id": 1, "text": "How do you handle team conflicts?", "interviewer": "HR Manager"},
                {"id": 2, "text": "Describe your technical approach to problem-solving.", "interviewer": "Technical Lead"},
                {"id": 3, "text": "Where do you see yourself in 5 years?", "interviewer": "Department Head"}
            ]
        elif type.lower() == 'stress':
            return [
                {"id": 1, "text": "You have 30 seconds: Explain your biggest achievement.", "timeLimit": 30},
                {"id": 2, "text": "Quick decision: How would you handle a project crisis?", "timeLimit": 45}
            ]
        else:
            return [
                {"id": 1, "text": "Tell me about yourself."},
                {"id": 2, "text": "What is your greatest strength?"}
            ]


def analyze_answer(question: str, answer: str) -> dict:

    prompt = f"""
    Analyze this interview answer.
    Question: {question}
    Answer: {answer}
    
    Return JSON: {{ "feedback": "string", "score": int (1-10), "suggestions": ["string", "string"] }}
    """
    
    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-flash', contents=prompt
        )
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except:
        return {"feedback": "Good effort.", "score": 5, "suggestions": ["Try again"]}

def generate_final_feedback(qa_list: list) -> dict:
    """Generate comprehensive final feedback from all Q&A pairs"""
    
    # Extract just Q&A without analysis for cleaner prompt
    qa_clean = [{"question": qa.get("question", ""), "answer": qa.get("answer", "")} for qa in qa_list]
    
    prompt = f"""
    Analyze this interview performance based on these Q&A pairs and provide detailed feedback:
    
    {json.dumps(qa_clean, indent=2)[:3000]}
    
    Return ONLY valid JSON in this exact format:
    {{
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "next_steps": ["actionable step 1", "actionable step 2", "actionable step 3"],
        "scores": {{
            "Confidence": 85,
            "Communication": 78,
            "Technical Skills": 92,
            "Stress Handling": 88
        }},
        "overall_score": 85,
        "detailed_analysis": "Comprehensive analysis paragraph"
    }}
    
    Rules:
    - All scores in the 'scores' object and 'overall_score' MUST be precise integers between 1 and 100.
    - Carefully calculate differences (e.g., strong tech answer = high tech score, but poor grammar = lower communication score).
    - Provide 2-4 strengths and weaknesses
    - Give 3-4 specific, actionable next steps
    - Write a detailed 2-3 sentence analysis
    """
    
    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-flash', contents=prompt
        )
        text = response.text.replace("```json", "").replace("```", "").strip()
        feedback = json.loads(text)
        
        # Validate required fields
        required_fields = ["strengths", "weaknesses", "next_steps", "scores", "overall_score", "detailed_analysis"]
        for field in required_fields:
            if field not in feedback:
                raise ValueError(f"Missing required field: {field}")
        
        # Ensure scores are valid 1-100 integers
        for k in feedback["scores"]:
            feedback["scores"][k] = max(0, min(100, int(feedback["scores"][k])))
            
        feedback["overall_score"] = max(0, min(100, int(feedback.get("overall_score", 50))))
        
        return feedback
        
    except Exception as e:
        print(f"Error generating final feedback: {e}")
        # Return fallback feedback with default 50/100 scores
        avg_score = 50
        if qa_list:
            # Try to calculate average from AI micro-analysis if available
            scores = [qa.get("analysis", {}).get("score", 5) for qa in qa_list if qa.get("analysis")]
            if scores:
                # Assuming analysis returned score out of 10, scale to 100
                avg_score = int((sum(scores) / len(scores)) * 10)
        
        return {
            "strengths": [
                "Attempted all questions",
                "Showed willingness to participate"
            ],
            "weaknesses": [
                "Could provide more detailed responses",
                "Practice articulating thoughts more clearly"
            ],
            "next_steps": [
                "Review common interview questions and prepare structured answers",
                "Practice the STAR method for behavioral questions",
                "Take another mock interview to track improvement"
            ],
            "scores": {
                "Confidence": avg_score,
                "Communication": avg_score,
                "Technical Skills": avg_score,
                "Stress Handling": avg_score
            },
            "overall_score": avg_score,
            "detailed_analysis": f"Based on {len(qa_list)} questions answered, you demonstrated basic competency. Focus on expanding your answers with specific examples and more technical depth to improve your performance."
        }

def analyze_body_language(frames_base64: list) -> dict:
    """Analyze candidate body language from webcam frames"""
    if not frames_base64:
        return {"body_language_score": None, "body_language_feedback": "No camera feed available to analyze."}
        
    try:
        contents = [
            "Analyze the body language in these frames extracted from a candidate's video interview. Provide a score out of 10 and a brief feedback paragraph focusing on eye contact, posture, and professional presence.\n"
            "Return ONLY standard JSON format without formatting backticks. Example:\n"
            '{"body_language_score": 8, "body_language_feedback": "Maintained good eye contact and confident posture."}'
        ]
        
        # We process a maximum of 5 frames to save tokens and request time
        import math
        step = math.ceil(len(frames_base64) / 5)
        selected_frames = frames_base64[::step][:5]
        
        for b64_str in selected_frames:
            # Strip data URL prefix if present (e.g., 'data:image/jpeg;base64,...')
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            contents.append(
                types.Part.from_bytes(
                    data=base64.b64decode(b64_str),
                    mime_type='image/jpeg'
                )
            )

        response = client.models.generate_content(
            model='models/gemini-2.5-flash',
            contents=contents
        )
        text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        
        score = result.get("body_language_score")
        if score is not None:
             score = max(0, min(10, int(score)))
        
        return {
            "body_language_score": score,
            "body_language_feedback": result.get("body_language_feedback", "Body language analysis unclear.")
        }
    except Exception as e:
        print(f"Body language analysis error: {e}")
        return {"body_language_score": None, "body_language_feedback": "Failed to analyze body language or rate limit exceeded."}
