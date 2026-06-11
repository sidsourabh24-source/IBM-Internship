from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserProfile(BaseModel):
    age: int = Field(..., ge=0, le=120, description="Age of the user")
    gender: str = Field(..., description="Gender (Male, Female, None)")
    state: str = Field(..., description="State of residence (e.g. Madhya Pradesh, Uttar Pradesh, Central)")
    occupation: str = Field(..., description="Occupation (e.g. Student, Farmer, Job Seeker, Senior Citizen, Startup, Low Income Family)")
    income: float = Field(..., ge=0, description="Annual family income in INR")
    category: str = Field(..., description="Caste Category (General, OBC, SC, ST, Any)")
    education: str = Field(..., description="Highest Education (e.g. 8th, 10th, 12th, Graduate, Undergraduate, Postgraduate, Any)")

class Scheme(BaseModel):
    id: str
    scheme_name: str
    ministry: str
    description: str
    benefits: str
    state: str
    target_groups: List[str]
    income_limit: Optional[float] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_restriction: str
    education_restriction: List[str]
    category_restriction: List[str]
    application_link: str
    required_documents: List[str]
    tags: List[str]

class EligibilityExplanation(BaseModel):
    status: str = Field(..., description="Eligible, Partially Eligible, Not Eligible")
    reason: str = Field(..., description="Detailed, user-friendly reasoning why they qualify or don't")
    score: int = Field(..., description="Matching score from 0 to 100")

class SchemeEligibilityResult(BaseModel):
    scheme: Scheme
    status: str  # "Eligible", "Partially Eligible", "Not Eligible"
    score: int   # Match score (0 to 100)
    ai_explanation: Optional[str] = None
    documents_checklist: List[str] = []

class Message(BaseModel):
    role: str  # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    history: List[Message] = []
    query: str
    profile: Optional[UserProfile] = None

class ChatResponse(BaseModel):
    response: str
    suggested_queries: List[str] = []

class DocumentAnalysisResponse(BaseModel):
    is_valid: bool
    verified_data: Dict[str, Any]
    missing_data: List[str]
    extracted_text_summary: str
    reasoning: str
