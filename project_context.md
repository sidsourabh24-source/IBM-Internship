# SchemeAI — AI-Powered Government Scheme Discovery & Eligibility Assistant
## Project Context & Architecture Documentation

This document provides a comprehensive technical overview of the SchemeAI project, detailing its architecture, code modules, frontend components, eligibility rules, and integration patterns.

---

## 🏗️ System Architecture & Data Flow

SchemeAI is designed as a lightweight, full-stack application. It leverages a rule-based filtering engine combined with the cognitive capabilities of **Google Gemini 2.5 Flash** to analyze user demographics and verify documents.

```
+-------------------------------------------------------------+
|               Frontend (React 18 + TS + Tailwind)           |
|  - App.tsx (State/Theme/Routing)                            |
|  - LandingPage.tsx / SchemeDiscovery.tsx (3-Step Wizard)    |
|  - ResultsDashboard.tsx / ChatAssistant.tsx (Bilingual/TTS) |
|  - DocAnalyzer.tsx (Document Auditor + Mock Templates)      |
+-------------------------------------------------------------+
                              │
                              │ HTTP Requests (Axios)
                              ▼
+-------------------------------------------------------------+
|                Backend (FastAPI + Pydantic)                 |
|  - app/main.py (App Core & API Endpoints)                   |
|  - app/schemas.py (Pydantic Data Schemas)                   |
+-------------------------------------------------------------+
             │                                   │
             ▼ Rule Evaluation                   ▼ Prompt Completion
+---------------------------+       +---------------------------+
|    Eligibility Engine     |       |      Gemini Service       |
| - app/eligibility.py      |       | - app/gemini_service.py   |
| - local schemes_db.json   |       | - gemini-2.5-flash model  |
|   (105 Indian schemes)    |       | - Mock Fallback Mode      |
+---------------------------+       +---------------------------+
```

---

## 📂 Core Directory & File Breakdown

### Backend (`/backend`)
* [app/main.py](file:///d:/IBM%20intern/backend/app/main.py): 
  * Configures FastAPI, CORS (`allow_origins=["*"]`), and defines the REST API endpoints:
    * `GET /`: Health check & loaded scheme counts.
    * `GET /api/schemes`: Fetch all registered schemes.
    * `POST /api/eligibility`: Filter and rank schemes based on a user profile.
    * `POST /api/explain`: Generate on-demand AI eligibility explanations (reduces API load/latency during discovery).
    * `POST /api/chat`: Handles bilingual chatbot requests with smart question suggestions.
    * `POST /api/analyze-doc`: Audits uploaded files (identity/income) using OCR/vision prompts.
* [app/eligibility.py](file:///d:/IBM%20intern/backend/app/eligibility.py):
  * **Rule Engine**: Checks State residency (Hard constraint), Gender (Hard constraint), Caste Category (Hard constraint), Age Limits, and Income Limits.
  * Calculates an eligibility match score from 0-100% and determines status: `Eligible` (score >= 90), `Partially Eligible` (50 <= score < 90), or `Not Eligible` (score < 50).
* [app/gemini_service.py](file:///d:/IBM%20intern/backend/app/gemini_service.py):
  * Interfaces with the Google GenAI SDK using `gemini-2.5-flash`.
  * Implements fallback **Mock Mode** if `GEMINI_API_KEY` is not provided, allowing offline testing and immediate response simulations.
  * Prompts configured:
    * `explain_scheme_eligibility`: Context-aware prompt explaining eligibility based on profile and specific scheme terms.
    * `conversational_agent`: System instructions defining SchemeAI's persona as an empathetic advisor. Parses user questions and outputs bold structures, bullet points, and `[SUGGESTIONS]` tags for suggested queries.
    * `analyze_document_context`: Structural audit of document contents, returning JSON matching the `DocumentAnalysisResponse` Pydantic model.
* [app/schemas.py](file:///d:/IBM%20intern/backend/app/schemas.py):
  * Defines Pydantic data schemas: `UserProfile`, `Scheme`, `EligibilityExplanation`, `SchemeEligibilityResult`, `Message`, `ChatRequest`, `ChatResponse`, and `DocumentAnalysisResponse`.
* [app/data/schemes_db.json](file:///d:/IBM%20intern/backend/app/data/schemes_db.json):
  * Local database storing 105 structured Indian government schemes.

### Frontend (`/frontend`)
* [src/App.tsx](file:///d:/IBM%20intern/frontend/src/App.tsx):
  * Main router holding global state:
    * Page routing: `landing`, `discovery`, `dashboard`, `chat`, `analyzer`.
    * LocalStorage persistence for user profile details, active language context (`en` vs `hi`), and Dark/Light mode theme values.
    * Configured API Base URL: `https://ibm-internship-oyrd.onrender.com` (pointing to Render hosting).
* [src/components/Navbar.tsx](file:///d:/IBM%20intern/frontend/src/components/Navbar.tsx):
  * Sticky header supporting responsive mobile toggle, bilingual switcher, dark mode toggle, and "Clear Profile" action.
* [src/components/LandingPage.tsx](file:///d:/IBM%20intern/frontend/src/components/LandingPage.tsx):
  * Premium SaaS landing page displaying platform stats (105+ Schemes, 98% Match Rate, Instant Auditing, Bilingual support) and guiding users into the wizard.
* [src/components/SchemeDiscovery.tsx](file:///d:/IBM%20intern/frontend/src/components/SchemeDiscovery.tsx):
  * 3-Step Wizard form collecting profile details (Age, Gender, State, Occupation, Annual Income, Category, Education) and submitting them to the backend eligibility route.
* [src/components/ResultsDashboard.tsx](file:///d:/IBM%20intern/frontend/src/components/ResultsDashboard.tsx):
  * Displays user profile summary, search matches grouped by eligibility status, match percentage progress rings, required documents checklist, and on-demand AI explanations.
* [src/components/ChatAssistant.tsx](file:///d:/IBM%20intern/frontend/src/components/ChatAssistant.tsx):
  * Interactive chatbot with speech-to-text integration (via Web Speech API browser microphone) and dynamic follow-up suggestions.
* [src/components/DocAnalyzer.tsx](file:///d:/IBM%20intern/frontend/src/components/DocAnalyzer.tsx):
  * Audit tool validating documents. Includes built-in Mock Template Chips to let evaluators instantly mock "Aadhaar MP", "Aadhaar UP", "Income 1.5L", or "Income 6L" documents without needing physical file uploads.

---

## ⚙️ Key Technical Mechanics

### 1. Pre-Filtering & Score Logic
Before querying the Gemini API, the backend pre-filters schemes to prevent unnecessary LLM invocations and latency:
* **State Check**: `scheme_state != "Central" and scheme_state.lower() != profile.state.lower()` leads to automatic `Not Eligible`.
* **Gender Check**: If a gender constraint is specified and mismatch occurs, status is immediately `Not Eligible`.
* **Caste Category Check**: Mismatches lead to immediate `Not Eligible`.
* **Age & Income Mismatches**: Minor deviations (e.g. age within 2-3 years, income within 25% over limits) penalize the score instead of instantly disqualifying the user, returning `Partially Eligible`.

### 2. Bilingual Translation Context
The conversational AI is instructed via system prompt to respond in Devnagari Hindi if the input includes terms like `योजना`, `मदद`, `क्या`, etc., or if the user forces the theme via language state.

### 3. Speech-to-Text Feature
The frontend hooks into browser-native `window.SpeechRecognition` or `window.webkitSpeechRecognition` to enable real-time speech input for accessibility.

---

## ⚡ Setup & Deployment Information

* **Backend Dev Command**: `python -m uvicorn app.main:app --reload`
* **Frontend Dev Command**: `npm run dev`
* **Production Build API URL**: `https://ibm-internship-oyrd.onrender.com`
* **Mock Mode Toggle**: Active automatically when the backend `.env` does not contain `GEMINI_API_KEY`.
