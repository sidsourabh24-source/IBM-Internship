import os
import json
import logging
from typing import List, Optional, Dict, Any
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
from app.config import settings
from app.schemas import UserProfile, Scheme, Message, DocumentAnalysisResponse
from app.eligibility import load_all_schemes

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini if key is available
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Gemini API successfully configured.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {str(e)}")
else:
    logger.warning("No GEMINI_API_KEY found. Running in Mock Mode.")

def get_model_name():
    # Using gemini-2.5-flash as requested
    return "gemini-2.5-flash"

def explain_scheme_eligibility(profile: UserProfile, scheme: Scheme, status: str, score: int) -> str:
    """
    Generate an AI explanation of why the user is Eligible, Partially Eligible, or Not Eligible.
    """
    if settings.is_mock_mode:
        return _generate_mock_explanation(profile, scheme, status, score)

    try:
        model = genai.GenerativeModel(get_model_name())
        prompt = f"""
        Analyze the eligibility of this user profile for the government scheme.
        
        USER PROFILE:
        - Age: {profile.age}
        - Gender: {profile.gender}
        - State: {profile.state}
        - Occupation: {profile.occupation}
        - Annual Income: ₹{profile.income:,.2f}
        - Caste Category: {profile.category}
        - Education: {profile.education}
        
        SCHEME DETAILS:
        - Scheme Name: {scheme.scheme_name}
        - Ministry: {scheme.ministry}
        - Description: {scheme.description}
        - Benefits: {scheme.benefits}
        - Income Limit: {scheme.income_limit if scheme.income_limit else 'No Limit'}
        - Age Range: {scheme.age_min if scheme.age_min else 0} to {scheme.age_max if scheme.age_max else 'No Limit'}
        - Target Groups: {', '.join(scheme.target_groups)}
        - Gender Restriction: {scheme.gender_restriction}
        - Education Restriction: {', '.join(scheme.education_restriction)}
        - Category Restriction: {', '.join(scheme.category_restriction)}
        
        MATCH STATUS CALCULATION:
        - Status: {status}
        - Match Score: {score}/100
        
        INSTRUCTIONS:
        1. Write a friendly, clear, and reassuring explanation in simple language (avoiding complex legal terms).
        2. Explain EXACTLY why the user qualifies, partially qualifies, or is ineligible. Reference specific numbers (e.g., 'your income of ₹{profile.income} is below the limit of ₹{scheme.income_limit}').
        3. Highlight the primary benefits they will receive.
        4. State the next steps or application tips.
        5. Keep it concise (3-4 sentences max).
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error during explain_scheme_eligibility: {str(e)}")
        return _generate_mock_explanation(profile, scheme, status, score) + f" (Fallback applied due to error: {str(e)})"

def conversational_agent(chat_history: List[Message], user_query: str, profile: Optional[UserProfile] = None) -> Dict[str, Any]:
    """
    Conversational agent that searches schemes and answers user questions about government benefits.
    """
    # 1. Fetch relevant scheme context
    all_schemes = load_all_schemes()
    scheme_context_list = []
    
    # Simple keyword extraction/filtering for context reduction
    query_lower = user_query.lower()
    keywords = ["farmer", "student", "women", "girl", "scholarship", "subsidy", "loan", "pension", "old age", "bpl", "income", "madhya pradesh", "up"]
    
    # Score schemes by keyword relevance and user profile if available
    scored_schemes = []
    for s in all_schemes:
        match_score = 0
        # Check title / desc keywords
        for kw in keywords:
            if kw in s["scheme_name"].lower() or kw in s["description"].lower():
                match_score += 2
        # If user profile is available, check occupation/state match
        if profile:
            if profile.state.lower() in s["state"].lower():
                match_score += 3
            for tg in s["target_groups"]:
                if tg.lower() in profile.occupation.lower():
                    match_score += 4
                    
        if match_score > 0:
            scored_schemes.append((match_score, s))
            
    # Take top 10 relevant schemes
    scored_schemes.sort(key=lambda x: -x[0])
    top_schemes = [item[1] for item in scored_schemes[:10]]
    
    # If list is empty, take first 5 schemes as basic fallback
    if not top_schemes:
        top_schemes = all_schemes[:5]

    schemes_text = ""
    for s in top_schemes:
        schemes_text += f"- ID: {s['id']}\n  Name: {s['scheme_name']}\n  Description: {s['description']}\n  Benefits: {s['benefits']}\n  Eligibility: Age {s['age_min']}-{s['age_max']}, Income Limit {s['income_limit']}, Gender {s['gender_restriction']}, Caste Category {s['category_restriction']}\n  Apply: {s['application_link']}\n  Documents: {', '.join(s['required_documents'])}\n\n"

    # 2. Check if Hindi language is requested
    is_hindi = any(word in query_lower for word in ["hindi", "हिंदी", "योजना", "मदद", "क्या", "मिलेगा", "पात्रता", "आवेदन", "मुझे"])
    
    if settings.is_mock_mode:
        return _generate_mock_chat_response(user_query, chat_history, top_schemes, profile, is_hindi)

    try:
        model = genai.GenerativeModel(
            get_model_name(),
            system_instruction="""You are 'SchemeAI', an empathetic and expert government benefits advisor. 
            Your goal is to help Indian citizens discover government schemes, scholarships, subsidies, and pensions they are eligible for.
            Use the provided scheme list as your knowledge database. 
            Provide clear, conversational answers. Convert dry government jargon into simple, encouraging terms.
            If the user asks in Hindi, or you detect Hindi language intent, respond in fluent, easy-to-understand Hindi (using Devnagari script).
            Highlight eligibility requirements and necessary documents clearly.
            At the end of your response, suggest 2-3 short, relevant follow-up questions they could click next.
            Always keep responses structured, using bold text and bullet points where helpful."""
        )
        
        # Build prompt history
        history_formatted = []
        for msg in chat_history:
            role = "user" if msg.role == "user" else "model"
            history_formatted.append({"role": role, "parts": [msg.content]})
            
        # Add the system context and the query
        profile_text = ""
        if profile:
            profile_text = f"USER PROFILE CONTEXT:\n- Age: {profile.age}\n- Gender: {profile.gender}\n- State: {profile.state}\n- Occupation: {profile.occupation}\n- Income: ₹{profile.income}\n- Category: {profile.category}\n- Education: {profile.education}\n\n"
            
        context_prompt = f"""
        {profile_text}
        AVAILABLE SCHEMES LIST (DATABASE):
        {schemes_text}
        
        USER QUESTION:
        "{user_query}"
        
        Answer the user's question accurately using the scheme list. Keep it conversational. If they don't specify their profile details but want to know if they qualify, encourage them to fill out their profile or share details.
        
        Format suggested questions at the very end of your response, separated by a line break, using the format:
        [SUGGESTIONS]
        1. Suggested question 1?
        2. Suggested question 2?
        """
        
        # We can append history using start_chat
        chat = model.start_chat(history=history_formatted[:-1] if len(history_formatted) > 1 else [])
        response = chat.send_message(context_prompt)
        
        full_text = response.text
        
        # Parse suggested queries from output
        suggested_queries = []
        if "[SUGGESTIONS]" in full_text:
            parts = full_text.split("[SUGGESTIONS]")
            main_response = parts[0].strip()
            suggestions_part = parts[1].strip()
            for line in suggestions_part.split("\n"):
                clean_line = line.strip()
                if clean_line and (clean_line.startswith("1.") or clean_line.startswith("2.") or clean_line.startswith("3.") or clean_line.startswith("-")):
                    # strip numbering
                    sq = clean_line.replace("1.", "").replace("2.", "").replace("3.", "").replace("-", "").strip()
                    if sq:
                        suggested_queries.append(sq)
        else:
            main_response = full_text.strip()
            # Default fallback suggestions
            suggested_queries = [
                "What documents are required for PM-Kisan?",
                "How do I apply for post-matric scholarships?",
                "Are there schemes for women entrepreneurs?"
            ]
            
        return {
            "response": main_response,
            "suggested_queries": suggested_queries[:3]
        }
    except Exception as e:
        logger.error(f"Error during conversational_agent: {str(e)}")
        return _generate_mock_chat_response(user_query, chat_history, top_schemes, profile, is_hindi)

def analyze_document_context(doc_text: str, scheme_id: str) -> DocumentAnalysisResponse:
    """
    Analyzes document text OCR results to check if it matches scheme requirements.
    """
    # Find the scheme
    all_schemes = load_all_schemes()
    scheme = next((s for s in all_schemes if s["id"] == scheme_id), None)
    
    if not scheme:
        return DocumentAnalysisResponse(
            is_valid=False,
            verified_data={},
            missing_data=["Scheme not found"],
            extracted_text_summary="Could not find scheme metadata",
            reasoning="The selected scheme is not registered in the system."
        )
        
    req_docs = scheme.get("required_documents", [])
    
    if settings.is_mock_mode:
        return _generate_mock_document_analysis(doc_text, scheme)

    try:
        model = genai.GenerativeModel(get_model_name())
        prompt = f"""
        You are an expert Document Auditor for government benefits. 
        Your task is to analyze the following extracted text from a uploaded document and verify if it satisfies the criteria for the scheme: "{scheme['scheme_name']}".
        
        SCHEME REQUIRED DOCUMENTS:
        {json.dumps(req_docs, indent=2)}
        
        SCHEME ELIGIBILITY RULES:
        - Income Limit: {scheme.get('income_limit')}
        - State requirement: {scheme.get('state')}
        
        EXTRACTED TEXT FROM UPLOADED DOCUMENT:
        ---
        {doc_text}
        ---
        
        Analyze the text carefully. Find details like Name, State/Address, Income figures, Caste Category, and Date of Birth if available.
        Check if this document satisfies one or more required documents (e.g. if it is an Income Certificate, does the income match the scheme limit? If it's Aadhaar, does it verify state?).
        
        Response must be in JSON format matching this Pydantic schema:
        {{
            "is_valid": true/false (true if the document is authentic and satisfies the criteria it represents),
            "verified_data": {{ "Field Name": "Value found in document" }},
            "missing_data": [ "list of details or stamps that seem missing or unclear" ],
            "extracted_text_summary": "Short summary of what this document is (e.g. 'Income certificate issued to Rajesh Kumar for FY 2024-25 showing income of 1.5 Lakh')",
            "reasoning": "Explain your logic: did it pass the income limit? Is the state correct? Is there any discrepancy?"
        }}
        
        Return ONLY valid JSON. No markdown wrappers.
        """
        
        response = model.generate_content(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        data = json.loads(response.text.strip())
        return DocumentAnalysisResponse(**data)
    except Exception as e:
        logger.error(f"Error during document analysis: {str(e)}")
        return _generate_mock_document_analysis(doc_text, scheme)

# --- MOCK GENERATORS ---

def _generate_mock_explanation(profile: UserProfile, scheme: Scheme, status: str, score: int) -> str:
    if status == "Eligible":
        return f"Congratulations! You fully qualify for **{scheme.scheme_name}**. Your profile matches all core criteria: your age ({profile.age}) is within the eligible range, your family income of ₹{profile.income:,.0f} is below the threshold, and you are from the target group '{profile.occupation}'. Next step: Click 'Apply' to visit the official portal and upload your {', '.join(scheme.required_documents[:2])}."
    elif status == "Partially Eligible":
        return f"You are **partially eligible** for **{scheme.scheme_name}** (Match score: {score}%). While you meet the demographic and education criteria, your family income of ₹{profile.income:,.0f} is slightly near or slightly above the standard limit of ₹{scheme.income_limit:,.0f}. We recommend applying anyway, as exceptions or secondary sub-schemes often apply for {profile.category} candidates."
    else:
        return f"Currently, you do not qualify for **{scheme.scheme_name}**. The primary reasons are: this scheme is targeted towards '{', '.join(scheme.target_groups)}' whereas you are a '{profile.occupation}', and there may be specific restrictions regarding state ({scheme.state}) or age range ({scheme.age_min}-{scheme.age_max} years)."

def _generate_mock_chat_response(query: str, history: List[Message], schemes: List[Dict[str, Any]], profile: Optional[UserProfile], is_hindi: bool) -> Dict[str, Any]:
    query_lower = query.lower()
    
    if is_hindi:
        # Hindi responses
        if "छात्र" in query_lower or "scholarship" in query_lower or "स्कॉलरशिप" in query_lower:
            response = """नमस्ते! छात्रों के लिए हमारे पास कई बेहतरीन सरकारी योजनाएं हैं:

1. **PM YASASVI योजना**: यह कक्षा 9 से 12 के OBC/SC छात्रों के लिए है, जिसमें ₹75,000 से ₹1,25,000 तक की सालाना मदद मिलती है।
2. **Post Matric Scholarship**: अनुसूचित जाति (SC) और जनजाति (ST) के छात्रों के लिए 100% ट्यूशन फीस रिफंड।
3. **Mukhyamantri Medhavi Chhatra Yojana (MP)**: यदि आप मध्य प्रदेश से हैं और आपके 12वीं में अच्छे अंक हैं, तो उच्च शिक्षा (IIT/Medical) की पूरी फीस राज्य सरकार भरेगी।

**आवश्यक दस्तावेज:**
* आय प्रमाण पत्र (Income Certificate)
* जाति प्रमाण पत्र (Caste Certificate)
* पिछली कक्षा की मार्कशीट

क्या आप इनमें से किसी योजना की आवेदन प्रक्रिया के बारे में विस्तार से जानना चाहते हैं?"""
            suggested = [
                "मेधावी छात्र योजना की पात्रता क्या है?",
                "पीएम यशस्वी योजना में आवेदन कैसे करें?",
                "छात्रों के लिए जरूरी दस्तावेज क्या हैं?"
            ]
        elif "किसान" in query_lower or "farmer" in query_lower or "खेती" in query_lower:
            response = """नमस्ते! किसानों के कल्याण के लिए केंद्र और राज्य सरकार द्वारा चलाई जा रही मुख्य योजनाएं निम्नलिखित हैं:

1. **PM-KISAN (प्रधानमंत्री किसान सम्मान निधि)**: इस योजना के तहत किसानों को हर साल ₹6,000 की नकद सहायता (₹2,000 की तीन किस्तों में) सीधे बैंक खाते में मिलती है।
2. **PM Fasal Bima Yojana**: प्राकृतिक आपदा या कीटों से फसल नष्ट होने पर बहुत ही कम प्रीमियम पर पूरा बीमा क्लेम मिलता है।
3. **PM-KUSUM योजना**: सोलर पंप लगाने के लिए सरकार 60% तक की भारी सब्सिडी प्रदान करती है।

**आवेदन करने के लिए आवश्यक कागजात:**
* आधार कार्ड
* भूमि के दस्तावेज (खतौनी / पाटा)
* बैंक खाता पासबुक

क्या आप अपने राज्य की किसी विशिष्ट किसान योजना के बारे में जानना चाहते हैं?"""
            suggested = [
                "पीएम किसान योजना की अगली किस्त कब आएगी?",
                "सोलर पंप योजना पर सब्सिडी कैसे मिलेगी?",
                "फसल बीमा का क्लेम कैसे करते हैं?"
            ]
        elif "महिला" in query_lower or "women" in query_lower or "लड़की" in query_lower:
            response = """नमस्ते! महिलाओं और बेटियों को सशक्त बनाने के लिए कई महत्वपूर्ण योजनाएं उपलब्ध हैं:

1. **लाडली बहना योजना (MP)**: मध्य प्रदेश की विवाहित महिलाओं को हर महीने ₹1,250 की आर्थिक सहायता दी जाती है।
2. **सुकन्या समृद्धि योजना (SSY)**: 10 वर्ष से कम उम्र की बच्चियों के लिए सबसे बेहतरीन बचत खाता योजना, जिस पर 8.2% ब्याज और टैक्स छूट मिलती है।
3. **फ्री सिलाई मशीन योजना**: आर्थिक रूप से कमजोर वर्ग की महिलाओं को खुद का रोजगार शुरू करने के लिए मुफ्त सिलाई मशीन दी जाती है।

क्या आप इनमें से किसी योजना की पात्रता या आवेदन लिंक के बारे में जानना चाहते हैं?"""
            suggested = [
                "लाडली बहना योजना की पात्रता क्या है?",
                "सिलाई मशीन योजना के लिए फॉर्म कहां मिलेगा?",
                "सुकन्या समृद्धि खाता कैसे खोलें?"
            ]
        else:
            response = """नमस्ते! मैं **SchemeAI** हूँ, आपका डिजिटल सरकारी योजना सहायक। 

मैं आपको शिक्षा (Scholarships), कृषि (Farmer Subsidies), महिला सशक्तिकरण, और वरिष्ठ नागरिक पेंशन जैसी सैकड़ों योजनाओं के बारे में सटीक जानकारी दे सकता हूँ।

बेहतर मदद के लिए, क्या आप मुझे अपने बारे में कुछ बता सकते हैं? जैसे:
1. आपकी उम्र क्या है?
2. आपका राज्य कौन सा है?
3. आपकी पारिवारिक आय कितनी है?

इससे मैं आपके लिए सबसे उपयुक्त योजनाओं की सूची ढूंढ सकूँगा।"""
            suggested = [
                "छात्रों के लिए योजनाएं बताएं।",
                "महिलाओं के लिए सरकारी योजनाएं क्या हैं?",
                "पेंशन योजनाओं के बारे में बताएं।"
            ]
    else:
        # English responses
        if "student" in query_lower or "scholarship" in query_lower:
            response = """Hello! There are several excellent scholarship and educational assistance schemes available for students:

1. **PM YASASVI Scheme**: Tailored for high school students (Class 9-12) from OBC/EBC/SC categories, offering ₹75,000 to ₹1,25,000 per year.
2. **Central Sector Scheme of Scholarship**: For college students scoring above the 80th percentile in class 12, offering ₹12,000 to ₹20,000 per year.
3. **Mukhyamantri Medhavi Chhatra Yojana (MP)**: For Madhya Pradesh students. If you scored 70%+ (MP Board) or 85%+ (CBSE) in class 12, the government covers 100% of your college fees (including Engineering/Medical/Law).

**Core Checklist:**
* Annual Income must be verified (usually below 2.5L to 6L).
* Keep your Aadhaar Card, caste certificate, and academic marksheets ready.

Which scholarship would you like to explore in detail?"""
            suggested = [
                "Am I eligible for Medhavi Chhatra Yojana?",
                "How to apply for PM Yasasvi Scholarship?",
                "Show scholarships for girls in technical courses."
            ]
        elif "farmer" in query_lower or "kisan" in query_lower:
            response = """Hello! Here are the top government schemes dedicated to farmers:

1. **PM-KISAN (Income Support)**: Direct cash assistance of ₹6,000 annually, transferred in 3 installments of ₹2,000 directly to bank accounts.
2. **PM-KUSUM (Solar Pumps)**: Get up to 60% subsidy for installing standalone solar irrigation pumps, reducing electricity dependency.
3. **Kisan Credit Card (KCC)**: Easy access to short-term agricultural loans up to ₹3 Lakh at an effective interest rate of just 4%.

**Common Documents Needed:**
* Aadhaar Card
* Land ownership certificate (Khatauni)
* Active Bank Passbook

Would you like to know how to register online for PM-Kisan or check your beneficiary status?"""
            suggested = [
                "How to apply for PM Kusum Solar Pump?",
                "What is the interest rate for Kisan Credit Card?",
                "Are there extra subsidies for farmers in MP?"
            ]
        elif "women" in query_lower or "girl" in query_lower or "female" in query_lower:
            response = """Hello! The government offers highly beneficial schemes to support women's health, education, and financial independence:

1. **Ladli Behna Yojana (Madhya Pradesh)**: Provides married women (ages 21-60) with direct cash support of ₹1,250 per month.
2. **Sukanya Samriddhi Yojana (SSY)**: A high-yielding savings plan (8.2% interest) for girl children under 10 years of age.
3. **Stand-Up India Scheme**: Offers bank loans from ₹10 Lakh to ₹1 Crore for women starting greenfield business ventures.

Which scheme would you like to check eligibility for or learn how to apply?"""
            suggested = [
                "How can I apply for Ladli Behna Yojana?",
                "What is the interest rate for Sukanya Samriddhi?",
                "Is there a free sewing machine scheme?"
            ]
        else:
            response = f"""Hello! I am **SchemeAI**, your personal government benefits advisor.

I can help you search, analyze eligibility, and guide you through applying for over 100+ Central and State Government schemes.

To give you a personalized recommendation, please share:
- **Your Age** (e.g., 21)
- **Your State** (e.g., Madhya Pradesh)
- **Your Occupation** (e.g., Student, Farmer)
- **Family Income** (e.g., Below 3 Lakhs)

Alternatively, feel free to ask me any question directly!"""
            suggested = [
                "What schemes are available for startups?",
                "Show me senior citizen pension schemes.",
                "How do I check my Aadhaar verification?"
            ]
            
    return {
        "response": response,
        "suggested_queries": suggested
    }

def _generate_mock_document_analysis(doc_text: str, scheme: Dict[str, Any]) -> DocumentAnalysisResponse:
    text_lower = doc_text.lower()
    
    # Analyze based on keywords in uploaded text
    is_income_certificate = "income" in text_lower or "आय" in text_lower or "salary" in text_lower or "certificate" in text_lower
    is_aadhaar = "aadhaar" in text_lower or "uidai" in text_lower or "government of india" in text_lower or "enrollment" in text_lower
    
    verified = {}
    missing = []
    is_valid = True
    reasoning = ""
    extracted_summary = ""
    
    if is_income_certificate:
        extracted_summary = "Income Certificate issued by Revenue Authority."
        # Extract fake income
        income_found = 150000
        if "1,50,000" in text_lower or "1.5" in text_lower or "150000" in text_lower:
            income_found = 150000
        elif "3,00,000" in text_lower or "3" in text_lower or "300000" in text_lower:
            income_found = 300000
            
        verified["Document Type"] = "Income Certificate"
        verified["Reported Annual Income"] = f"₹{income_found:,}"
        
        limit = scheme.get("income_limit")
        if limit:
            verified["Scheme Income Limit"] = f"₹{limit:,}"
            if income_found <= limit:
                reasoning = f"Document verified successfully. The family income of ₹{income_found:,} is below the scheme limit of ₹{limit:,}."
            else:
                is_valid = False
                reasoning = f"Validation failed. The family income of ₹{income_found:,} exceeds the scheme limit of ₹{limit:,}."
        else:
            reasoning = "Income certificate analyzed. No specific income limit is enforced for this scheme."
            
        if "seal" not in text_lower and "signature" not in text_lower:
            missing.append("Official seal of the Tehsildar / Competent Authority")
            
    elif is_aadhaar:
        extracted_summary = "Aadhaar Card (UIDAI) identifying document."
        verified["Document Type"] = "Aadhaar Card"
        
        # Verify state if scheme is state-specific
        scheme_state = scheme.get("state", "Central")
        if scheme_state != "Central":
            verified["Required State"] = scheme_state
            if scheme_state.lower() in text_lower:
                verified["Address Match"] = f"State matches {scheme_state}"
                reasoning = f"Document verified successfully. Aadhaar card confirms residency in {scheme_state}."
            else:
                is_valid = False
                verified["Address Match"] = "State mismatch"
                reasoning = f"Validation failed. The scheme is restricted to {scheme_state}, but the Aadhaar text does not verify this state residency."
        else:
            reasoning = "Aadhaar card details verified. Identity confirmed."
            
        if "dob" not in text_lower and "birth" not in text_lower:
            missing.append("Date of Birth (DOB) field")
    else:
        # Generic text
        is_valid = True
        extracted_summary = "Unidentified document text parsed."
        reasoning = "Document text was successfully scanned, but it does not match standard Aadhaar or Income Certificate structures. Some fields were verified generically."
        verified["Scanned Text Length"] = f"{len(doc_text)} characters"
        
    return DocumentAnalysisResponse(
        is_valid=is_valid,
        verified_data=verified,
        missing_data=missing,
        extracted_text_summary=extracted_summary,
        reasoning=reasoning
    )
