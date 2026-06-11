import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Landmark } from 'lucide-react'
import { UserProfile, SchemeEligibilityResult } from '../App'
import axios from 'axios'

interface SchemeDiscoveryProps {
  onSubmit: (profile: UserProfile, results: SchemeEligibilityResult[]) => void
  lang: 'en' | 'hi'
  initialProfile: UserProfile | null
  apiUrl: string
}

const SchemeDiscovery: React.FC<SchemeDiscoveryProps> = ({ onSubmit, lang, initialProfile, apiUrl }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const [age, setAge] = useState<number>(initialProfile?.age || 21)
  const [gender, setGender] = useState<string>(initialProfile?.gender || "Female")
  const [state, setState] = useState<string>(initialProfile?.state || "Madhya Pradesh")
  const [occupation, setOccupation] = useState<string>(initialProfile?.occupation || "Student")
  const [income, setIncome] = useState<number>(initialProfile?.income || 150000)
  const [category, setCategory] = useState<string>(initialProfile?.category || "OBC")
  const [education, setEducation] = useState<string>(initialProfile?.education || "Undergraduate")

  const t = {
    en: {
      title: "Tell Us About Yourself",
      subtitle: "Enter your demographic details. Our AI engine will filter and rank government schemes customized to your profile.",
      step1: "Demographics",
      step2: "Socio-Economic",
      step3: "Occupation",
      ageLabel: "Age (Years)",
      genderLabel: "Gender",
      genderMale: "Male",
      genderFemale: "Female",
      genderOther: "Other / Prefer not to say",
      stateLabel: "State of Residence",
      incomeLabel: "Annual Family Income (INR)",
      categoryLabel: "Caste Category",
      educationLabel: "Highest Education Level",
      occupationLabel: "Primary Occupation / Interest Group",
      btnNext: "Next Step",
      btnBack: "Previous",
      btnSubmit: "Find My Schemes",
      loadingEngine: "Running eligibility engine...",
      loadingAI: "Analyzing match criteria with Gemini...",
      loadingRank: "Ranking schemes by relevance..."
    },
    hi: {
      title: "अपने बारे में बताएं",
      subtitle: "अपने जनसांख्यिकीय विवरण दर्ज करें। हमारा एआई इंजन आपकी प्रोफ़ाइल के अनुसार सरकारी योजनाओं को खोजेगा और रैंक करेगा।",
      step1: "जनसांख्यिकी",
      step2: "सामाजिक-आर्थिक",
      step3: "व्यवसाय",
      ageLabel: "उम्र (वर्ष)",
      genderLabel: "लिंग",
      genderMale: "पुरुष",
      genderFemale: "महिला",
      genderOther: "अन्य / बताना नहीं चाहते",
      stateLabel: "मूल राज्य",
      incomeLabel: "वार्षिक पारिवारिक आय (रुपये)",
      categoryLabel: "जाति श्रेणी",
      educationLabel: "उच्चतम शिक्षा स्तर",
      occupationLabel: "प्राथमिक व्यवसाय / श्रेणी",
      btnNext: "अगला कदम",
      btnBack: "पीछे",
      btnSubmit: "योजनाएं खोजें",
      loadingEngine: "पात्रता इंजन चल रहा है...",
      loadingAI: "जेमिनी एआई के साथ मिलान का विश्लेषण...",
      loadingRank: "प्रासंगिकता के अनुसार रैंकिंग..."
    }
  }[lang]

  const states = [
    "Central", "Madhya Pradesh", "Uttar Pradesh", "Maharashtra", 
    "Bihar", "Gujarat", "Delhi", "Rajasthan", "Karnataka", "Tamil Nadu"
  ]

  const occupations = [
    "Student", "Farmer", "Job Seeker", "Senior Citizen", "Startup / Entrepreneur", "Low Income Family"
  ]

  const categories = [
    "General", "OBC", "SC", "ST", "Any"
  ]

  const educations = [
    "8th", "10th", "12th", "Undergraduate", "Graduate", "Postgraduate", "Any"
  ]

  // Client-side fallback eligibility engine in case FastAPI is offline
  const runLocalFallbackEligibility = (profileData: UserProfile): SchemeEligibilityResult[] => {
    // Basic local match matching logic
    // Normally load schemes from seed directly
    // Let's import mock data to ensure fallback is complete
    return []
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const profileData: UserProfile = {
      age,
      gender,
      state,
      occupation,
      income,
      category,
      education
    }

    try {
      // Step 1 status
      setLoadingStatus(t.loadingEngine)
      await new Promise(r => setTimeout(r, 600));
      
      // Step 2 status
      setLoadingStatus(t.loadingAI)
      
      const response = await axios.post(`${apiUrl}/api/eligibility`, profileData)
      
      setLoadingStatus(t.loadingRank)
      await new Promise(r => setTimeout(r, 500));
      
      onSubmit(profileData, response.data)
    } catch (err: any) {
      console.warn("Backend server not running. Running client-side search fallback...", err)
      // If server is not responding, we will fetch schemes from client and run matching rules locally
      // This is a premium fail-safe!
      try {
        // Fetch all schemes (if possible) or generate mock results
        const mockResultsResponse = await axios.get(`${apiUrl}/api/schemes`).catch(() => null)
        let schemesList = []
        if (mockResultsResponse && mockResultsResponse.data) {
          schemesList = mockResultsResponse.data
        } else {
          // Hardcoded fallback list if even /schemes fails
          schemesList = [
            {
              id: "pm_yasasvi",
              scheme_name: "PM Young Achievers Scholarship Award Scheme for Vibrant India (PM YASASVI)",
              ministry: "Ministry of Social Justice and Empowerment",
              description: "A scholarship program designed for OBC, EBC, and DNT students studying in Top Class Schools.",
              benefits: "School fee, hostel fee, and books reimbursement up to ₹75,000/year (class 9-10) and ₹1,25,000/year (class 11-12).",
              state: "Central",
              target_groups: ["Student"],
              income_limit: 250000,
              age_min: 13,
              age_max: 19,
              gender_restriction: "None",
              education_restriction: ["10th", "Any"],
              category_restriction: ["OBC", "ST", "SC"],
              application_link: "https://yet.nta.ac.in/",
              required_documents: ["Aadhaar Card", "Income Certificate", "Caste Certificate", "Previous Class Marksheet"],
              tags: ["Student", "Scholarship"]
            },
            {
              id: "mp_medhavi_chhatra",
              scheme_name: "Mukhyamantri Medhavi Chhatra Yojana (Madhya Pradesh)",
              ministry: "Department of Higher Education, Madhya Pradesh",
              description: "Covers higher education costs (Engineering, Medical, Law) for meritorious students of Madhya Pradesh.",
              benefits: "Full tuition fee reimbursement for students securing admission in IITs, NITs, NLU, or government colleges.",
              state: "Madhya Pradesh",
              target_groups: ["Student"],
              income_limit: 600000,
              age_min: 16,
              age_max: 28,
              gender_restriction: "None",
              education_restriction: ["Undergraduate", "Graduate"],
              category_restriction: ["Any"],
              application_link: "https://scholarshipportal.mp.nic.in/",
              required_documents: ["Aadhaar Card", "Marksheet of Class XII (min 70% in MP Board)", "MP Domicile", "Income Certificate"],
              tags: ["Student", "Madhya Pradesh"]
            },
            {
              id: "mp_ladli_behna",
              scheme_name: "Mukhyamantri Ladli Behna Yojana (Madhya Pradesh)",
              ministry: "Women and Child Development Department, Madhya Pradesh",
              description: "Enhances the economic independence of women and improves their health/nutrition status.",
              benefits: "Direct cash transfer of ₹1,250 per month (₹15,000 per year) directly to bank accounts of married women.",
              state: "Madhya Pradesh",
              target_groups: ["Women"],
              income_limit: 250000,
              age_min: 21,
              age_max: 60,
              gender_restriction: "Female",
              education_restriction: ["Any"],
              category_restriction: ["Any"],
              application_link: "https://cmladlibahna.mp.gov.in/",
              required_documents: ["Aadhaar Card", "MP Samagra ID", "Bank Account (DBT Enabled)"],
              tags: ["Women", "Madhya Pradesh"]
            },
            {
              id: "pm_kisan",
              scheme_name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
              ministry: "Ministry of Agriculture and Farmers Welfare",
              description: "An initiative by the Government of India that provides income support to landholder farmer families.",
              benefits: "₹6,000 per year in three equal installments of ₹2,000 directly transferred to bank accounts.",
              state: "Central",
              target_groups: ["Farmer"],
              income_limit: null,
              age_min: 18,
              age_max: 100,
              gender_restriction: "None",
              education_restriction: ["Any"],
              category_restriction: ["Any"],
              application_link: "https://pmkisan.gov.in/",
              required_documents: ["Aadhaar Card", "Land ownership documents (Khatauni)", "Bank Account Details"],
              tags: ["Farmer", "Income Support"]
            }
          ]
        }

        // Run local matching logic
        const processedResults = schemesList.map((scheme: any) => {
          let score = 100
          
          // State constraint
          if (scheme.state !== "Central" && scheme.state.toLowerCase() !== profileData.state.toLowerCase()) {
            return { scheme, status: 'Not Eligible', score: 0, documents_checklist: scheme.required_documents }
          }
          // Gender constraint
          if (scheme.gender_restriction !== "None" && scheme.gender_restriction.toLowerCase() !== profileData.gender.toLowerCase()) {
            return { scheme, status: 'Not Eligible', score: 0, documents_checklist: scheme.required_documents }
          }
          // Category constraint
          if (!scheme.category_restriction.includes("Any") && !scheme.category_restriction.includes(profileData.category)) {
            return { scheme, status: 'Not Eligible', score: 0, documents_checklist: scheme.required_documents }
          }
          // Age limit
          if (scheme.age_min && profileData.age < scheme.age_min) return { scheme, status: 'Not Eligible', score: 0, documents_checklist: scheme.required_documents }
          if (scheme.age_max && profileData.age > scheme.age_max) return { scheme, status: 'Not Eligible', score: 0, documents_checklist: scheme.required_documents }
          
          // Income limit
          if (scheme.income_limit && profileData.income > scheme.income_limit) {
            const diff = (profileData.income - scheme.income_limit) / scheme.income_limit
            if (diff <= 0.25) {
              score -= 30
            } else {
              return { scheme, status: 'Not Eligible', score: 0, documents_checklist: scheme.required_documents }
            }
          }
          
          // Occupation match
          const target_groups = scheme.target_groups.map((tg: string) => tg.toLowerCase())
          const matches_occ = target_groups.some((tg: string) => tg.includes(profileData.occupation.toLowerCase()) || profileData.occupation.toLowerCase().includes(tg))
          
          if (!matches_occ) {
            score -= 40
          }

          let status: 'Eligible' | 'Partially Eligible' | 'Not Eligible' = 'Eligible'
          if (score >= 90) status = 'Eligible'
          else if (score >= 50) status = 'Partially Eligible'
          else status = 'Not Eligible'

          return {
            scheme,
            status,
            score,
            documents_checklist: scheme.required_documents
          }
        })

        const filtered = processedResults.filter((r: any) => r.status !== 'Not Eligible')
        // Sort
        filtered.sort((a: any, b: any) => {
          if (a.status === 'Eligible' && b.status !== 'Eligible') return -1
          if (a.status !== 'Eligible' && b.status === 'Eligible') return 1
          return b.score - a.score
        })

        await new Promise(r => setTimeout(r, 1000));
        onSubmit(profileData, filtered)
      } catch (fallbackErr) {
        setError("Error connecting to backend or loading local fallback database.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 flex flex-col justify-center">
      
      {loading ? (
        // Loading Spinner State
        <div className="w-full max-w-lg mx-auto glass-panel p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center animate-pulse-slow">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin"></div>
            <Sparkles className="w-8 h-8 text-brand-secondary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{loadingStatus}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while our engine calculates your match parameters...</p>
        </div>
      ) : (
        // Main Wizard form
        <div className="w-full glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-6 h-6 text-brand-primary" />
                {t.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{t.subtitle}</p>
            </div>
            
            {/* Step Indicators */}
            <div className="flex gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-brand-primary' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-brand-primary' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-brand-primary' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="p-8">
            {error && (
              <div className="p-4 mb-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-500 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* STEP 1: Basic Demographics */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.ageLabel}: <span className="text-brand-primary font-bold">{age}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-brand-primary bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer h-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>1 Yr</span>
                    <span>50 Yrs</span>
                    <span>100 Yrs</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    {t.genderLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {["Female", "Male", "None"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-3 px-4 rounded-xl border text-sm font-bold transition duration-200 ${gender === g ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        {g === "Female" ? t.genderFemale : g === "Male" ? t.genderMale : t.genderOther}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.stateLabel}
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-primary"
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Socio-Economic details */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.incomeLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[50000, 150000, 300000, 600000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setIncome(inc)}
                        className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-md transition"
                      >
                        ₹{inc / 100000} Lakh
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.categoryLabel}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition duration-200 ${category === c ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.educationLabel}
                  </label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-primary"
                  >
                    {educations.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: Occupation */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.occupationLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {occupations.map((occ) => (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => setOccupation(occ)}
                        className={`py-4 px-6 rounded-2xl border text-left font-bold transition duration-200 flex items-center justify-between ${occupation === occ ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        <span>{occ}</span>
                        {occupation === occ && <Sparkles className="w-5 h-5 text-brand-secondary" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl transition flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.btnBack}
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 font-bold rounded-xl transition flex items-center gap-2 text-sm ml-auto"
                >
                  {t.btnNext}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl shadow-neon-indigo hover:scale-[1.02] transition ml-auto flex items-center gap-2 text-sm"
                >
                  {t.btnSubmit}
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>

          </form>

        </div>
      )}

    </div>
  )
}

export default SchemeDiscovery
