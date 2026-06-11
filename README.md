# SchemeAI — AI-Powered Government Scheme Discovery & Eligibility Assistant

SchemeAI is a next-generation full-stack AI platform designed to act as an intelligent government benefits advisor for Indian citizens. Leveraging the speed and multi-modal intelligence of **Google Gemini 2.5 Flash**, the system moves away from typical dry databases with text filters, delivering a personalized, conversational, and explanatory benefit discovery experience.

The platform is designed to cater to:
* **Students** (Scholarships, technical awards, travel grants)
* **Farmers** (Solar pump subsidies, crop insurance, KCC loans)
* **Women** (Empowerment initiatives, cash aids, savings schemes)
* **Senior Citizens** (Social security pensions, assisted living aids)
* **Startups & Entrepreneurs** (Collateral-free loans, incubation funding)
* **Low-Income Families** (Subsidized rations, housing grants, free healthcare)

---

## 🏗️ System Architecture

The application is split into a lightweight, high-performance FastAPI backend and a responsive, beautiful React + TypeScript + Tailwind CSS frontend.

```
Frontend (React + Vite + TS) 
      ↓ (HTTP requests via Axios)
FastAPI Backend (app/main.py)
      ↓ (Rule-based pre-filtering / scoring)
Eligibility Engine (app/eligibility.py) ← Local JSON DB (105 schemes)
      ↓ (Contextual prompts)
Gemini API (gemini-2.5-flash)
      ↓
Empathetic, structured advisor response (English & Hindi)
```

### Key Technologies:
* **Frontend**: React 18, TypeScript, Tailwind CSS (SaaS theme, glassmorphism, glowing micro-animations, dark/light theme, canvas-confetti).
* **Backend**: Python 3, FastAPI, Pydantic (data structures), Uvicorn (ASGI server), python-dotenv, python-multipart (file processing).
* **AI Engine**: Google GenAI SDK (Model: `gemini-2.5-flash` for high-speed bilingual responses and structured audit parsing).
* **Database**: Local JSON File Database (`schemes_db.json`) populated with **105 real Indian government schemes** across state and central domains. (Eliminates MongoDB install overhead for easy evaluation).

---

## 🌟 Core Features

### 1. AI Eligibility Analysis & Ranker
* **Demographic Rules**: Automatically checks State residency, Gender restrictions, Age limits, Caste Category, and Occupation constraints.
* **Match Scoring**: Calculates an initial matching percentage (0-100%) based on criteria compliance.
* **Gemini Explanations**: Translates dry government policies into a friendly 3-sentence summary clarifying *exactly* why you qualify, what you receive, and how to apply.

### 2. Conversational Scheme Advisor
* **Chat Interface**: ChatGPT-style conversational search.
* **Bilingual Support**: Fully understands and answers queries in English or fluent Hindi (using Devnagari script).
* **Smart Follow-Ups**: Dynamically recommends follow-up questions at the end of each AI answer.
* **Speech-to-Text Voice Assistant**: Connects to the Web Speech API so users can tap the microphone to ask questions verbally.

### 3. Smart Document Auditor
* **Audit System**: Checks uploaded Aadhaar Cards, Income Certificates, or Student ID cards against selected scheme requirements.
* **multimodal OCR Parsing**: Extracts fields (e.g. State, Income, Date of Birth, official seals) and validates them.
* **Mock Template Chips**: Provides pre-baked document templates (Aadhaar MP vs Aadhaar UP, Income 1.5L vs 6L) for instant visual evaluations without requiring real document files.

---

## 🚀 Step-by-Step Setup Guide

### 1. Configure the Backend (FastAPI)

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   HOST=127.0.0.1
   PORT=8000
   ```
   *(Note: If you leave `GEMINI_API_KEY` blank, the backend automatically engages a **Mock Mode** that generates realistic, personalized responses so you can inspect the entire flow instantly without an API key).*
5. Run the seeding script to compile the database (Already generated inside `backend/app/data/schemes_db.json` during setup, but you can run it again):
   ```bash
   python scripts/seed_schemes.py
   ```
6. Start the API server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   The backend will be live at: `http://127.0.0.1:8000`

---

### 2. Configure the Frontend (React)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be live at: `http://localhost:5173`

---

## 📂 Project Structure

```
d:/IBM intern/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   └── schemes_db.json      # Compiled JSON DB of 105 schemes
│   │   ├── routes/
│   │   ├── __init__.py
│   │   ├── config.py                # Environment configs & Mock Check
│   │   ├── eligibility.py           # Pre-filtering & scoring rules
│   │   ├── gemini_service.py        # Gemini client prompts & mock fallbacks
│   │   ├── main.py                  # CORS config, endpoints & file upload
│   │   └── schemas.py               # Pydantic schemas for requests/responses
│   ├── scripts/
│   │   └── seed_schemes.py          # Seeding script containing 105 schemes
│   └── requirements.txt             # Python dependency list
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatAssistant.tsx    # Conversational Chat + Voice input
│   │   │   ├── DocAnalyzer.tsx      # Document Auditor + Mock template chips
│   │   │   ├── LandingPage.tsx      # SaaS landing page with metrics
│   │   │   ├── Navbar.tsx           # Sticky nav + Language / Dark mode toggle
│   │   │   ├── ResultsDashboard.tsx # Eligibility progress rings & checklists
│   │   │   └── SchemeDiscovery.tsx  # 3-step wizard form + loading mesh
│   │   ├── App.tsx                  # Global State, page routing & theme contexts
│   │   ├── index.css                # Tailwind base + custom glassmorphism utilities
│   │   └── main.tsx                 # DOM Entrypoint
│   ├── index.html                   # HTML Shell + SEO + Google Fonts
│   ├── package.json                 # Dev & Production dependencies
│   ├── postcss.config.js
│   ├── tailwind.config.js           # Brand styling system ( Sapphire, Indigo, Emerald)
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md                        # Product Manual
```
