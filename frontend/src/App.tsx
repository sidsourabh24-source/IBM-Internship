import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import SchemeDiscovery from './components/SchemeDiscovery'
import ResultsDashboard from './components/ResultsDashboard'
import ChatAssistant from './components/ChatAssistant'
import DocAnalyzer from './components/DocAnalyzer'

export interface UserProfile {
  age: number
  gender: string
  state: string
  occupation: string
  income: number
  category: string
  education: string
}

export interface Scheme {
  id: string
  scheme_name: str
  ministry: string
  description: string
  benefits: string
  state: string
  target_groups: string[]
  income_limit: number | null
  age_min: number | null
  age_max: number | null
  gender_restriction: string
  education_restriction: string[]
  category_restriction: string[]
  application_link: string
  required_documents: string[]
  tags: string[]
}

export interface SchemeEligibilityResult {
  scheme: Scheme
  status: 'Eligible' | 'Partially Eligible' | 'Not Eligible'
  score: number
  ai_explanation?: string | null
  documents_checklist: string[]
}

export type Page = 'landing' | 'discovery' | 'dashboard' | 'chat' | 'analyzer'
export type Language = 'en' | 'hi'

function App() {
  const [page, setPage] = useState<Page>('landing')
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('schemeai_profile')
    return saved ? JSON.parse(saved) : null
  })
  const [results, setResults] = useState<SchemeEligibilityResult[]>([])
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('schemeai_lang') as Language) || 'en'
  })
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('schemeai_dark') === 'true' || 
      (!('schemeai_dark' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })
  
  // Base API URL
  const API_BASE_URL = 'http://127.0.0.1:8000'

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('schemeai_dark', String(darkMode))
  }, [darkMode])

  // Sync language
  useEffect(() => {
    localStorage.setItem('schemeai_lang', lang)
  }, [lang])

  // Handle user completing profile discovery
  const handleProfileSubmit = (newProfile: UserProfile, searchResults: SchemeEligibilityResult[]) => {
    setProfile(newProfile)
    localStorage.setItem('schemeai_profile', JSON.stringify(newProfile))
    setResults(searchResults)
    setPage('dashboard')
  }

  // Clear profile
  const handleClearProfile = () => {
    setProfile(null)
    setResults([])
    localStorage.removeItem('schemeai_profile')
    setPage('landing')
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col transition-colors duration-300">
      {/* Glow overlays */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[120px] dark:bg-brand-primary/5"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/10 rounded-full blur-[120px] dark:bg-brand-secondary/5"></div>
      </div>

      <Navbar 
        page={page} 
        setPage={setPage} 
        lang={lang} 
        setLang={setLang} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        hasProfile={!!profile}
        onClearProfile={handleClearProfile}
      />

      <main className="flex-grow flex flex-col relative z-10">
        {page === 'landing' && (
          <LandingPage 
            setPage={setPage} 
            lang={lang} 
            hasProfile={!!profile} 
          />
        )}
        
        {page === 'discovery' && (
          <SchemeDiscovery 
            onSubmit={handleProfileSubmit} 
            lang={lang}
            initialProfile={profile}
            apiUrl={API_BASE_URL}
          />
        )}
        
        {page === 'dashboard' && (
          <ResultsDashboard 
            results={results} 
            profile={profile}
            onEditProfile={() => setPage('discovery')}
            setPage={setPage}
            lang={lang}
            apiUrl={API_BASE_URL}
            setSelectedSchemeForAnalyzer={(scheme) => {
              setSelectedScheme(scheme)
              setPage('analyzer')
            }}
          />
        )}
        
        {page === 'chat' && (
          <ChatAssistant 
            profile={profile} 
            lang={lang}
            apiUrl={API_BASE_URL}
          />
        )}
        
        {page === 'analyzer' && (
          <DocAnalyzer 
            results={results} 
            selectedScheme={selectedScheme}
            setSelectedScheme={setSelectedScheme}
            lang={lang}
            apiUrl={API_BASE_URL}
          />
        )}
      </main>

      <footer className="w-full py-6 mt-12 glass-panel border-t border-slate-200/50 dark:border-slate-800/50 z-10 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} SchemeAI. Created under the Solo Internship Initiative.</p>
          <div className="flex gap-4">
            <a href="https://india.gov.in" target="_blank" rel="noreferrer" className="hover:text-brand-primary transition">National Portal of India</a>
            <span>•</span>
            <a href="#" className="hover:text-brand-primary transition">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
