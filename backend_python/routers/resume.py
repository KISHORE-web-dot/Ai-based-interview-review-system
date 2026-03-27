from fastapi import APIRouter, UploadFile, File, HTTPException
from services.parser_service import extract_text_from_file
from models.schemas import ResumeResponse

router = APIRouter()

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.docx', '.doc')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX allowed.")
    
    text = await extract_text_from_file(file)
    
    return {
        "text": text,
        "filename": file.filename
    }
