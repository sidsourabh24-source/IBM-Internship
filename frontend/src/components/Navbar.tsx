import React, { useState } from 'react'
import { Sun, Moon, Globe, RefreshCw, Layers, MessageSquare, ShieldCheck, Home, Menu, X } from 'lucide-react'
import { Page, Language } from '../App'

interface NavbarProps {
  page: Page
  setPage: (page: Page) => void
  lang: Language
  setLang: (lang: Language) => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  hasProfile: boolean
  onClearProfile: () => void
}

const Navbar: React.FC<NavbarProps> = ({
  page,
  setPage,
  lang,
  setLang,
  darkMode,
  setDarkMode,
  hasProfile,
  onClearProfile
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = {
    en: {
      brand: "SchemeAI",
      home: "Home",
      discovery: "Find Schemes",
      dashboard: "My Benefits",
      chat: "AI Advisor",
      analyzer: "Doc Auditor",
      reset: "Reset Profile",
      langBtn: "हिन्दी"
    },
    hi: {
      brand: "SchemeAI",
      home: "मुख्य पृष्ठ",
      discovery: "योजना खोजें",
      dashboard: "मेरी योजनाएं",
      chat: "एआई सलाहकार",
      analyzer: "दस्तावेज जांच",
      reset: "प्रोफ़ाइल बदलें",
      langBtn: "English"
    }
  }[lang]

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setPage('landing')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-neon-indigo text-white font-bold text-xl group-hover:scale-105 transition duration-300">
            S
          </div>
          <span className="text-xl font-extrabold font-sans tracking-tight text-gradient">
            {t.brand}
          </span>
          <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-medium bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 rounded-full">
            AI-Powered
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          <button 
            onClick={() => setPage('landing')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${page === 'landing' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Home className="w-4 h-4" />
            {t.home}
          </button>
          
          <button 
            onClick={() => setPage(hasProfile ? 'dashboard' : 'discovery')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${page === 'discovery' || page === 'dashboard' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Layers className="w-4 h-4" />
            {hasProfile ? t.dashboard : t.discovery}
          </button>
          
          <button 
            onClick={() => setPage('chat')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${page === 'chat' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.chat}
          </button>
          
          <button 
            onClick={() => setPage('analyzer')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${page === 'analyzer' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t.analyzer}
          </button>
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Reset profile button */}
          {hasProfile && (
            <button
              onClick={onClearProfile}
              title={t.reset}
              className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.reset}
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 text-xs font-bold"
            title="Change Language"
          >
            <Globe className="w-4 h-4 text-brand-primary" />
            <span>{t.langBtn}</span>
          </button>

          {/* Theme Toggler */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-4.5 h-4.5 text-yellow-500" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-brand-secondary" />
            )}
          </button>

          {/* Hamburger (Mobile navigation) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg px-4 py-4 space-y-2 animate-slide-down shadow-lg">
          <button 
            onClick={() => { setPage('landing'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${page === 'landing' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Home className="w-4 h-4" />
            {t.home}
          </button>
          
          <button 
            onClick={() => { setPage(hasProfile ? 'dashboard' : 'discovery'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${page === 'discovery' || page === 'dashboard' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Layers className="w-4 h-4" />
            {hasProfile ? t.dashboard : t.discovery}
          </button>
          
          <button 
            onClick={() => { setPage('chat'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${page === 'chat' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.chat}
          </button>
          
          <button 
            onClick={() => { setPage('analyzer'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${page === 'analyzer' ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t.analyzer}
          </button>

          {hasProfile && (
            <button
              onClick={() => { onClearProfile(); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t.reset}
            </button>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar
