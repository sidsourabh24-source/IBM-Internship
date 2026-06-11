import React from 'react'
import { ArrowRight, MessageSquare, ShieldCheck, GraduationCap, Sprout, UserCheck, Heart, Rocket } from 'lucide-react'
import { Page, Language } from '../App'

interface LandingPageProps {
  setPage: (page: Page) => void
  lang: Language
  hasProfile: boolean
}

const LandingPage: React.FC<LandingPageProps> = ({ setPage, lang, hasProfile }) => {
  const t = {
    en: {
      heroTitle: "Unlock Your Eligible Government Schemes with AI",
      heroSubtitle: "Stop searching through confusing portals. Simply enter your profile or ask our AI Benefits Advisor to discover scholarships, subsidies, and pensions you qualify for.",
      ctaFind: hasProfile ? "Go to My Dashboard" : "Find My Schemes",
      ctaChat: "Talk to AI Advisor",
      statsSchemes: "100+ Schemes",
      statsSchemesSub: "Central & State data",
      statsSpeed: "Instant Match",
      statsSpeedSub: "Rule engine filtering",
      statsLang: "Bilingual",
      statsLangSub: "English & हिन्दी support",
      exploreCat: "Explore by Category",
      student: "Students",
      studentSub: "Scholarships, skill loans & hostels",
      farmer: "Farmers",
      farmerSub: "Subsidies, solar pumps & credits",
      women: "Women",
      womenSub: "Empowerment, savings & maternity",
      senior: "Senior Citizens",
      seniorSub: "Pensions, savings & medical aids",
      startup: "Startups & Micro-Business",
      startupSub: "Collateral-free loans & seed funds",
      featuresTitle: "Core AI Capabilities",
      featEligibility: "AI Eligibility Analysis",
      featEligibilitySub: "Rule-based criteria filters and Gemini explanations clarify exactly why you qualify.",
      featChat: "Conversational Discovery",
      featChatSub: "Ask natural questions like 'What benefits can a 21-year-old student from MP get?' in English or Hindi.",
      featDoc: "Smart Document Auditor",
      featDocSub: "Upload Aadhaar or Income Certificates. The AI matches document values against scheme requirements."
    },
    hi: {
      heroTitle: "एआई के साथ अपनी पात्रता वाली सरकारी योजनाएं खोजें",
      heroSubtitle: "उलझाने वाली सरकारी वेबसाइटों को छोड़ें। बस अपनी प्रोफ़ाइल दर्ज करें या छात्रवृत्ति, सब्सिडी और पेंशन खोजने के लिए हमारे एआई सलाहकार से सीधे बात करें।",
      ctaFind: hasProfile ? "डैशबोर्ड पर जाएं" : "मेरी योजनाएं खोजें",
      ctaChat: "एआई सलाहकार से बात करें",
      statsSchemes: "100+ योजनाएं",
      statsSchemesSub: "केंद्र और राज्य सरकार की जानकारी",
      statsSpeed: "त्वरित परिणाम",
      statsSpeedSub: "सटीक पात्रता जांच",
      statsLang: "द्विभाषी",
      statsLangSub: "English और हिंदी में बातचीत",
      exploreCat: "श्रेणी के अनुसार खोजें",
      student: "छात्र",
      studentSub: "स्कॉलरशिप, कौशल ऋण और छात्रावास",
      farmer: "किसान",
      farmerSub: "सब्सिडी, सोलर पंप और फसल बीमा",
      women: "महिलाएं",
      womenSub: "सशक्तिकरण, बचत योजनाएं और मातृत्व लाभ",
      senior: "वरिष्ठ नागरिक",
      seniorSub: "पेंशन, बचत और सहायक उपकरण",
      startup: "स्टार्टअप और लघु उद्योग",
      startupSub: "बिना गारंटी के ऋण और सहायता राशि",
      featuresTitle: "प्रमुख एआई क्षमताएं",
      featEligibility: "एआई पात्रता विश्लेषण",
      featEligibilitySub: "नियम आधारित फिल्टर और जेमिनी एआई आपको सरल भाषा में समझाते हैं कि आप योग्य क्यों हैं।",
      featChat: "संवादात्मक खोज (चैट)",
      featChatSub: "'मध्य प्रदेश के 21 वर्षीय छात्र को क्या लाभ मिल सकते हैं?' जैसे सवाल सीधे हिंदी या इंग्लिश में पूछें।",
      featDoc: "स्मार्ट दस्तावेज जांच",
      featDocSub: "आधार या आय प्रमाण पत्र अपलोड करें। एआई तुरंत जांचेगा कि दस्तावेज नियमों के अनुसार सही हैं या नहीं।"
    }
  }[lang]

  const categories = [
    { name: t.student, sub: t.studentSub, icon: GraduationCap, color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/10", tag: "Student" },
    { name: t.farmer, sub: t.farmerSub, icon: Sprout, color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/10", tag: "Farmer" },
    { name: t.women, sub: t.womenSub, icon: Heart, color: "from-pink-500 to-rose-500", shadow: "shadow-pink-500/10", tag: "Women" },
    { name: t.senior, sub: t.seniorSub, icon: UserCheck, color: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/10", tag: "Senior Citizen" },
    { name: t.startup, sub: t.startupSub, icon: Rocket, color: "from-indigo-500 to-violet-500", shadow: "shadow-indigo-500/10", tag: "Startup" },
  ]

  const handleCategoryClick = (tag: string) => {
    // Navigate to discovery, seed default occupation if needed
    setPage('discovery')
  }

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 pt-16 pb-12 md:py-24 text-center flex flex-col items-center relative">
        <div className="absolute top-[20%] w-[100px] h-[100px] bg-brand-secondary/30 blur-[50px] animate-pulse-slow"></div>
        
        {/* Decorative Badge */}
        <div className="animate-fade-in inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-xs font-semibold text-brand-secondary mb-6 shadow-sm">
          <span>✨</span>
          <span>Next-Gen Indian Benefits Portal</span>
        </div>

        <h1 className="animate-slide-up text-4xl sm:text-5xl md:text-6xl font-black font-sans tracking-tight max-w-4xl leading-[1.1] text-slate-900 dark:text-white mb-6">
          {t.heroTitle}
        </h1>

        <p className="animate-slide-up text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed mb-10">
          {t.heroSubtitle}
        </p>

        {/* Call to Actions */}
        <div className="animate-slide-up flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setPage(hasProfile ? 'dashboard' : 'discovery')}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold rounded-2xl shadow-neon-indigo hover:scale-[1.02] active:scale-[0.98] transition duration-300 flex items-center justify-center gap-2 group"
          >
            {t.ctaFind}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition duration-300" />
          </button>
          
          <button
            onClick={() => setPage('chat')}
            className="w-full sm:w-auto px-8 py-4 glass-panel border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-white font-bold rounded-2xl transition duration-300 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5 text-brand-primary" />
            {t.ctaChat}
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-6xl mx-auto px-4 py-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center text-center">
            <span className="text-3xl font-extrabold text-brand-primary">{t.statsSchemes}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">{t.statsSchemesSub}</span>
          </div>
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center text-center">
            <span className="text-3xl font-extrabold text-brand-secondary">{t.statsSpeed}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">{t.statsSpeedSub}</span>
          </div>
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center text-center">
            <span className="text-3xl font-extrabold text-brand-accent">{t.statsLang}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">{t.statsLangSub}</span>
          </div>
        </div>
      </section>

      {/* Category Explorer */}
      <section className="w-full max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 dark:text-white text-center mb-8">
          {t.exploreCat}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon
            return (
              <div
                key={idx}
                onClick={() => handleCategoryClick(cat.tag)}
                className={`glass-panel p-6 rounded-3xl hover:scale-105 transition duration-300 border border-slate-200/50 dark:border-slate-800/50 cursor-pointer flex flex-col items-center text-center shadow-sm ${cat.shadow} group`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white mb-4 group-hover:rotate-6 transition duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{cat.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{cat.sub}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Core AI Capabilities */}
      <section className="w-full max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 dark:text-white text-center mb-12">
          {t.featuresTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl group-hover:bg-brand-primary/10 transition"></div>
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-6">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t.featEligibility}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.featEligibilitySub}</p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full blur-xl group-hover:bg-brand-secondary/10 transition"></div>
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t.featChat}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.featChatSub}</p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-xl group-hover:bg-brand-accent/10 transition"></div>
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 text-brand-accent flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t.featDoc}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.featDocSub}</p>
          </div>
        </div>
      </section>

    </div>
  )
}

export default LandingPage
