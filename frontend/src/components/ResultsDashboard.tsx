import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, User, Edit2, FileText, CheckSquare, Square, ChevronDown, ChevronUp, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import { SchemeEligibilityResult, UserProfile, Scheme } from '../App'
import axios from 'axios'
import confetti from 'canvas-confetti'

interface ResultsDashboardProps {
  results: SchemeEligibilityResult[]
  profile: UserProfile | null
  onEditProfile: () => void
  setPage: (page: any) => void
  lang: 'en' | 'hi'
  apiUrl: string
  setSelectedSchemeForAnalyzer: (scheme: Scheme) => void
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  profile,
  onEditProfile,
  setPage,
  lang,
  apiUrl,
  setSelectedSchemeForAnalyzer
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'eligible' | 'partial'>('all')
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null)
  
  // AI Explanations state
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [loadingExpl, setLoadingExpl] = useState<Record<string, boolean>>({})
  
  // Checklist state (Scheme ID -> document name -> boolean)
  const [documentChecklist, setDocumentChecklist] = useState<Record<string, Record<string, boolean>>>({})

  const t = {
    en: {
      dashboardTitle: "Your Personalized Benefits",
      dashboardSubtitle: "Based on your socio-economic profile, here are the government programs you qualify for.",
      profileCard: "My Profile",
      editProfile: "Edit Profile",
      allSchemes: "All Schemes",
      eligibleOnly: "Eligible Only",
      partialOnly: "Partially Eligible",
      noResults: "No Matching Schemes Found",
      noResultsSub: "Try widening your search constraints or editing your profile details.",
      matchingScore: "Match",
      aiExplBtn: "Explain with AI",
      aiExplTitle: "AI Eligibility Analysis",
      checklistTitle: "Required Documents Checklist",
      applyBtn: "Apply Online",
      verifyBtn: "Scan & Audit Documents",
      ministry: "Ministry",
      state: "State",
      benefits: "Benefits",
      nextSteps: "Application Guidance"
    },
    hi: {
      dashboardTitle: "आपके व्यक्तिगत लाभ",
      dashboardSubtitle: "आपकी सामाजिक-आर्थिक प्रोफ़ाइल के आधार पर, यहाँ वे सरकारी कार्यक्रम दिए गए हैं जिनके लिए आप पात्र हैं।",
      profileCard: "मेरी प्रोफ़ाइल",
      editProfile: "प्रोफ़ाइल बदलें",
      allSchemes: "सभी योजनाएं",
      eligibleOnly: "पूर्ण पात्र",
      partialOnly: "आंशिक पात्र",
      noResults: "कोई योजना नहीं मिली",
      noResultsSub: "कृपया अपनी प्रोफ़ाइल में थोड़ा बदलाव करें या आय सीमा की दोबारा जांच करें।",
      matchingScore: "मिलान",
      aiExplBtn: "एआई द्वारा समझें",
      aiExplTitle: "एआई पात्रता विश्लेषण",
      checklistTitle: "आवश्यक दस्तावेजों की सूची",
      applyBtn: "ऑनलाइन आवेदन",
      verifyBtn: "दस्तावेज स्कैन और जांचें",
      ministry: "मंत्रालय",
      state: "राज्य",
      benefits: "लाभ",
      nextSteps: "आवेदन प्रक्रिया"
    }
  }[lang]

  // Trigger celebration on 100% match loading
  React.useEffect(() => {
    const has100 = results.some(r => r.score === 100 && r.status === 'Eligible')
    if (has100) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#6366f1', '#10b981']
      })
    }
  }, [results])

  const handleFetchAiExplanation = async (result: SchemeEligibilityResult) => {
    const schemeId = result.scheme.id
    if (aiExplanations[schemeId]) return // Already fetched
    
    setLoadingExpl(prev => ({ ...prev, [schemeId]: true }))
    
    try {
      const response = await axios.post(`${apiUrl}/api/explain`, {
        profile,
        scheme: result.scheme,
        status: result.status,
        score: result.score
      })
      
      setAiExplanations(prev => ({
        ...prev,
        [schemeId]: response.data.explanation
      }))
    } catch (err) {
      console.error("Error fetching AI explanation, applying fallback...", err)
      // client-side explanation logic fallback
      let fallbackText = ""
      if (result.status === "Eligible") {
        fallbackText = `You are eligible for **${result.scheme.scheme_name}** because you are a ${profile?.occupation} from ${profile?.state} and your family income is within limits.`
      } else {
        fallbackText = `You qualify partially for **${result.scheme.scheme_name}**. Although your occupation (${profile?.occupation}) matches, your income exceeds the normal limit slightly.`
      }
      setAiExplanations(prev => ({
        ...prev,
        [schemeId]: fallbackText
      }))
    } finally {
      setLoadingExpl(prev => ({ ...prev, [schemeId]: false }))
    }
  }

  const toggleExpand = (result: SchemeEligibilityResult) => {
    const schemeId = result.scheme.id
    if (expandedSchemeId === schemeId) {
      setExpandedSchemeId(null)
    } else {
      setExpandedSchemeId(schemeId)
      // Automatically load AI explanation on expand!
      handleFetchAiExplanation(result)
    }
  }

  const toggleDocumentCheck = (schemeId: string, doc: string) => {
    setDocumentChecklist(prev => {
      const schemeList = prev[schemeId] || {}
      return {
        ...prev,
        [schemeId]: {
          ...schemeList,
          [doc]: !schemeList[doc]
        }
      }
    })
  }

  // Filter schemes
  const filteredResults = results.filter(r => {
    if (activeTab === 'eligible') return r.status === 'Eligible'
    if (activeTab === 'partial') return r.status === 'Partially Eligible'
    return true
  })

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
      
      {/* Title */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
          {t.dashboardTitle}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          {t.dashboardSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Profile Card Sidebar */}
        {profile && (
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4 mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-primary" />
                  {t.profileCard}
                </h3>
                <button
                  onClick={onEditProfile}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-primary transition"
                  title={t.editProfile}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Age</span>
                  <span className="text-slate-900 dark:text-white">{profile.age} Yrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Gender</span>
                  <span className="text-slate-900 dark:text-white">{profile.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span>State</span>
                  <span className="text-slate-900 dark:text-white">{profile.state}</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupation</span>
                  <span className="text-slate-900 dark:text-white">{profile.occupation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Income</span>
                  <span className="text-slate-900 dark:text-white">₹{profile.income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category</span>
                  <span className="text-slate-900 dark:text-white">{profile.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Education</span>
                  <span className="text-slate-900 dark:text-white">{profile.education}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schemes List Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Tab Filter buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl w-full sm:w-max">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-grow sm:flex-grow-0 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'all' ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-primary' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {t.allSchemes} ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('eligible')}
              className={`flex-grow sm:flex-grow-0 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'eligible' ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-accent' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {t.eligibleOnly} ({results.filter(r => r.status === 'Eligible').length})
            </button>
            <button
              onClick={() => setActiveTab('partial')}
              className={`flex-grow sm:flex-grow-0 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'partial' ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-warning' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {t.partialOnly} ({results.filter(r => r.status === 'Partially Eligible').length})
            </button>
          </div>

          {filteredResults.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center">
              <HelpCircle className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.noResults}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{t.noResultsSub}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result, idx) => {
                const scheme = result.scheme
                const isExpanded = expandedSchemeId === scheme.id
                const isEligible = result.status === 'Eligible'
                const hasFetchedExplanation = !!aiExplanations[scheme.id]
                const isExplanationLoading = !!loadingExpl[scheme.id]
                
                // document counts
                const totalDocs = result.documents_checklist.length
                const checkedDocs = Object.values(documentChecklist[scheme.id] || {}).filter(Boolean).length

                return (
                  <div
                    key={scheme.id}
                    className={`glass-panel rounded-3xl border transition duration-300 shadow-sm overflow-hidden flex flex-col ${isExpanded ? 'border-brand-primary/40 shadow-md ring-1 ring-brand-primary/20' : isEligible ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-amber-500/20 hover:border-amber-500/40'}`}
                  >
                    
                    {/* Collapsed Header View */}
                    <div 
                      onClick={() => toggleExpand(result)}
                      className="p-6 cursor-pointer flex justify-between items-start gap-4 hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition"
                    >
                      <div className="flex-grow space-y-2">
                        {/* Scheme Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${isEligible ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                            {isEligible ? 'Full Match' : 'Partial Match'}
                          </span>
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                            {scheme.state === 'Central' ? 'Central Scheme' : scheme.state}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight leading-snug">
                          {scheme.scheme_name}
                        </h3>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                          {scheme.description}
                        </p>
                      </div>

                      {/* Score Indicator Ring */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <svg className="absolute w-full h-full transform -rotate-90">
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                              strokeWidth="4"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              className={`fill-none transition-all duration-1000 ${isEligible ? 'stroke-brand-accent' : 'stroke-brand-warning'}`}
                              strokeWidth="4"
                              strokeDasharray={2 * Math.PI * 24}
                              strokeDashoffset={2 * Math.PI * 24 * (1 - result.score / 100)}
                            />
                          </svg>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{result.score}%</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{t.matchingScore}</span>
                      </div>
                    </div>

                    {/* Expanded Content View */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10 space-y-6 pt-6">
                        
                        {/* 1. AI Eligibility Analysis Report */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 border border-brand-primary/10 relative overflow-hidden">
                          <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-brand-secondary">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Gemini AI analysis</span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">{t.aiExplTitle}</h4>
                          
                          {isExplanationLoading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                              <span>Asking AI advisor...</span>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                              {aiExplanations[scheme.id] || "No explanation available."}
                            </p>
                          )}
                        </div>

                        {/* 2. Benefits */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          <div className="md:col-span-2 space-y-2">
                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-3.5 rounded bg-brand-primary inline-block"></span>
                              {t.benefits}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
                              {scheme.benefits}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-3.5 rounded bg-brand-secondary inline-block"></span>
                              Metadata
                            </h4>
                            <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 text-xs font-semibold space-y-2 text-slate-500 dark:text-slate-400">
                              <div>{t.ministry}: <span className="text-slate-800 dark:text-white">{scheme.ministry}</span></div>
                              <div>{t.state}: <span className="text-slate-800 dark:text-white">{scheme.state}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Required Documents Checklist */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-3.5 rounded bg-brand-accent inline-block"></span>
                              {t.checklistTitle}
                            </span>
                            <span className="text-xs text-brand-accent font-semibold">{checkedDocs}/{totalDocs} ready</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {result.documents_checklist.map((doc) => {
                              const isChecked = !!(documentChecklist[scheme.id] || {})[doc]
                              return (
                                <div
                                  key={doc}
                                  onClick={() => toggleDocumentCheck(scheme.id, doc)}
                                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${isChecked ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-700 dark:text-slate-300' : 'bg-white/30 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 text-slate-500'}`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <span className="text-xs font-semibold leading-tight">{doc}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-end items-center gap-3">
                          <button
                            onClick={() => setSelectedSchemeForAnalyzer(scheme)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-4 h-4" />
                            {t.verifyBtn}
                          </button>
                          
                          <a
                            href={scheme.application_link}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl shadow-neon-indigo hover:opacity-95 transition text-xs flex items-center justify-center gap-1.5"
                          >
                            <span>{t.applyBtn}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default ResultsDashboard
