import os
import pypdf
import docx
from fastapi import UploadFile, HTTPException

async def extract_text_from_file(file: UploadFile) -> str:
    file_ext = file.filename.split('.')[-1].lower()
    
    # Save temp file
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    try:
        text = ""
        if file_ext == "pdf":
            reader = pypdf.PdfReader(temp_filename)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif file_ext in ["docx", "doc"]:
            doc = docx.Document(temp_filename)
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")
    finally:
        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
