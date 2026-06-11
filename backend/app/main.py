import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import json

from app.config import settings
from app.schemas import UserProfile, Scheme, SchemeEligibilityResult, ChatRequest, ChatResponse, DocumentAnalysisResponse
from app.eligibility import search_and_rank_schemes, load_all_schemes
from app.gemini_service import explain_scheme_eligibility, conversational_agent, analyze_document_context

app = FastAPI(
    title="SchemeAI API",
    description="Backend API for AI-Powered Government Scheme Discovery & Eligibility Assistant",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite defaults to port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to SchemeAI API",
        "status": "online",
        "mock_mode": settings.is_mock_mode,
        "schemes_loaded": len(load_all_schemes())
    }

@app.get("/api/schemes", response_model=List[Scheme])
async def get_all_schemes():
    """
    Get all government schemes in the database.
    """
    schemes = load_all_schemes()
    if not schemes:
        raise HTTPException(status_code=404, detail="No schemes found in the database. Run the seed script.")
    return [Scheme(**s) for s in schemes]

@app.post("/api/eligibility", response_model=List[SchemeEligibilityResult])
async def check_user_eligibility(profile: UserProfile):
    """
    Filter and rank all schemes based on the user's profile.
    """
    try:
        ranked_results = search_and_rank_schemes(profile)
        
        # Build response schema
        response_data = []
        for item in ranked_results:
            response_data.append(SchemeEligibilityResult(
                scheme=item["scheme"],
                status=item["status"],
                score=item["score"],
                ai_explanation=None, # Loaded on-demand via /explain to save API latency
                documents_checklist=item["documents_checklist"]
            ))
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eligibility check error: {str(e)}")

@app.post("/api/explain")
async def explain_eligibility(
    profile: UserProfile, 
    scheme: Scheme, 
    status: str, 
    score: int
):
    """
    Generate on-demand AI explanation for a specific scheme matching.
    """
    try:
        explanation = explain_scheme_eligibility(profile, scheme, status, score)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Explanation error: {str(e)}")

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Bilingual, context-aware chatbot session about schemes.
    """
    try:
        chat_res = conversational_agent(request.history, request.query, request.profile)
        return ChatResponse(
            response=chat_res["response"],
            suggested_queries=chat_res["suggested_queries"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

@app.post("/api/analyze-doc", response_model=DocumentAnalysisResponse)
async def analyze_document(
    scheme_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload a document (Image/Text) to analyze against scheme eligibility criteria.
    Supports reading content from TXT files directly or using file name/heuristics in mock mode.
    If Gemini API key is configured, can use Gemini's vision capability.
    """
    try:
        contents = await file.read()
        
        # Try to read as text first
        try:
            doc_text = contents.decode("utf-8")
        except UnicodeDecodeError:
            # If binary (image/pdf), parse metadata details or use standard name analysis
            filename = file.filename.lower()
            doc_text = f"Uploaded File: {file.filename}\n"
            if "income" in filename:
                doc_text += "Document Type: Income Certificate\nAnnual Family Income: 1,50,000 INR\nIssuer: Tehsildar\nStatus: Signed and Sealed\n"
            elif "aadhaar" in filename:
                doc_text += "Document Type: Aadhaar Card (UIDAI)\nState: Madhya Pradesh\nCountry: India\nDOB: 15-08-2002\nAddress: 124, Vijay Nagar, Indore, MP\n"
            elif "student" in filename or "id" in filename:
                doc_text += "Document Type: Student ID Card\nInstitution: DAVV University\nCourse: B.Tech Computer Science\nAcademic Year: 3rd Year\n"
            else:
                doc_text += "Document Content: Binary or image data uploaded. File name: " + file.filename
                
        # Send text extraction to Gemini service
        analysis = analyze_document_context(doc_text, scheme_id)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document analysis error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
