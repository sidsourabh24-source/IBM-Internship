import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Sparkles, MessageSquare, Loader2, RefreshCw } from 'lucide-react'
import { UserProfile, Message } from '../App'
import axios from 'axios'

interface ChatAssistantProps {
  profile: UserProfile | null
  lang: 'en' | 'hi'
  apiUrl: string
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ profile, lang, apiUrl }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const t = {
    en: {
      advisorTitle: "AI Government Schemes Advisor",
      advisorSubtitle: "Ask me any questions about Indian scholarships, farming subsidies, women benefits, or pensions.",
      inputPlaceholder: "Ask something... (e.g. 'What scholarships can I apply for?')",
      suggestedTitle: "Suggested Questions",
      welcomeMsg: "Hello! I am your AI government schemes advisor. How can I help you today? If you have filled out your profile, I will automatically prioritize schemes matching your demographics.",
      hindiWelcomeMsg: "नमस्ते! मैं आपका एआई सरकारी योजना सलाहकार हूँ। मैं आपकी कैसे मदद कर सकता हूँ? यदि आपने प्रोफ़ाइल भरी है, तो मैं स्वतः आपके अनुकूल योजनाओं को प्राथमिकता दूँगा।",
      voiceError: "Speech recognition not supported in this browser.",
      listening: "Listening..."
    },
    hi: {
      advisorTitle: "एआई सरकारी योजना सलाहकार",
      advisorSubtitle: "भारतीय छात्रवृत्ति, कृषि सब्सिडी, महिला सशक्तिकरण लाभ या पेंशन योजनाओं के बारे में पूछें।",
      inputPlaceholder: "कुछ पूछें... (जैसे 'छात्राओं के लिए कौन सी योजनाएं हैं?')",
      suggestedTitle: "सुझाए गए प्रश्न",
      welcomeMsg: "नमस्ते! मैं आपका एआई सरकारी योजना सलाहकार हूँ। मैं आपकी कैसे मदद कर सकता हूँ? यदि आपने प्रोफ़ाइल भरी है, तो मैं स्वतः आपके अनुकूल योजनाओं को प्राथमिकता दूँगा।",
      hindiWelcomeMsg: "नमस्ते! मैं आपका एआई सरकारी योजना सलाहकार हूँ। मैं आपकी कैसे मदद कर सकता हूँ? यदि आपने प्रोफ़ाइल भरी है, तो मैं स्वतः आपके अनुकूल योजनाओं को प्राथमिकता दूँगा।",
      voiceError: "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।",
      listening: "सुन रहा हूँ..."
    }
  }[lang]

  // Setup initial message & default suggestions
  useEffect(() => {
    const defaultWelcome = lang === 'hi' ? t.hindiWelcomeMsg : t.welcomeMsg
    setMessages([
      { role: 'model', content: defaultWelcome }
    ])

    const defaultSuggestions = lang === 'hi' ? [
      "छात्रों के लिए स्कॉलरशिप बताएं",
      "किसानों के लिए कौन सी योजनाएं हैं?",
      "मध्य प्रदेश की योजनाएं क्या हैं?"
    ] : [
      "What scholarships can I apply for?",
      "Show me government subsidies for farmers.",
      "Are there special schemes for women in MP?"
    ]
    setSuggestions(defaultSuggestions)
  }, [lang])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
      
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript
        setInput(text)
        setIsListening(false)
      }
      
      rec.onerror = () => {
        setIsListening(false)
      }
      
      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }
  }, [lang])

  // Custom text formatter to render basic markdown patterns into HTML safely
  const renderFormattedMessage = (text: string) => {
    // Escape HTML tags to prevent XSS
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace bold tags: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split lines
    const lines = formatted.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          
          // Check if bullet point
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            const content = trimmed.substring(1).trim();
            return (
              <ul key={idx} className="list-disc pl-5 text-sm">
                <li dangerouslySetInnerHTML={{ __html: content }} />
              </ul>
            );
          }
          
          // Check if numbered point (e.g. 1. text)
          const numberMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numberMatch) {
            const num = numberMatch[1];
            const content = numberMatch[2];
            return (
              <ol key={idx} className="list-decimal pl-5 text-sm">
                <li value={num} dangerouslySetInnerHTML={{ __html: content }} />
              </ol>
            );
          }
          
          // Standard text
          return <p key={idx} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: line }} />;
        })}
      </div>
    );
  }

  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend || input).trim()
    if (!query) return

    setInput("")
    setErrorState(null)
    
    // Add user message
    const userMsg: Message = { role: 'user', content: query }
    const updatedHistory = [...messages, userMsg]
    setMessages(updatedHistory)
    setLoading(true)

    try {
      const response = await axios.post(`${apiUrl}/api/chat`, {
        history: updatedHistory,
        query: query,
        profile: profile
      })

      setMessages(prev => [...prev, { role: 'model', content: response.data.response }])
      setSuggestions(response.data.suggested_queries || [])
    } catch (err) {
      console.warn("Backend chat failed, using local fallback responses...", err)
      // Local fallback simulator logic
      await new Promise(r => setTimeout(r, 1200))
      
      const isHindi = lang === 'hi' || query.match(/[\u0900-\u097F]/)
      let fallbackText = ""
      let fallbackSuggestions: string[] = []

      if (isHindi) {
        if (query.includes("छात्र") || query.includes("स्कॉलरशिप")) {
          fallbackText = "**छात्रों के लिए योजनाएं:**\\n\\n1. **PM YASASVI योजना**: OBC/SC श्रेणी के लिए ₹1.25 लाख/वर्ष तक छात्रवृत्ति।\\n2. **मध्य प्रदेश मेधावी छात्र योजना**: यदि आप MP से हैं और 12वीं में अच्छे अंक हैं, तो आपकी पूरी कॉलेज फीस राज्य सरकार देगी।\\n\\n*आवश्यक कागजात:* आय प्रमाण पत्र, जाति प्रमाण पत्र, और 12वीं की मार्कशीट।";
          fallbackSuggestions = ["मेधावी योजना की पात्रता क्या है?", "यशस्वी योजना में आवेदन की अंतिम तिथि क्या है?"];
        } else if (query.includes("किसान")) {
          fallbackText = "**किसानों के लिए लाभ:**\\n\\n1. **PM-KISAN**: प्रति वर्ष ₹6,000 की नकद सहायता सीधे खाते में।\\n2. **PM-KUSUM**: सौर सिंचाई पंप के लिए 60% सब्सिडी।\\n\\n*कागजात:* खतौनी (जमीन का परचा) और आधार कार्ड।";
          fallbackSuggestions = ["सोलर पंप के लिए आवेदन कैसे करें?", "किसान क्रेडिट कार्ड ब्याज दर क्या है?"];
        } else {
          fallbackText = "माफ़ कीजिये, मैं वर्तमान में सिमुलेशन मोड में हूँ। लेकिन मैं आपको शिक्षा, कृषि, महिला सशक्तिकरण और सामाजिक पेंशन योजनाओं की जानकारी दे सकता हूँ। कृपया इनमें से किसी एक के बारे में पूछें।";
          fallbackSuggestions = ["छात्रों की योजनाएं दिखाएं", "महिलाओं के लिए योजनाएं"];
        }
      } else {
        if (query.toLowerCase().includes("student") || query.toLowerCase().includes("scholarship")) {
          fallbackText = "**Student Scholarships Available:**\\n\\n1. **PM Yasasvi Scholarship**: Up to ₹1.25 Lakh per year for OBC/EBC students in top-class institutions.\\n2. **Central Sector Scheme**: Merit-based assistance of ₹12,000 - ₹20,000 annually.\\n3. **Mukhyamantri Medhavi Chhatra (MP)**: 100% higher education fee coverage for MP board students scoring above 70%.\\n\\n*Common Documents:* Income certificate (<2.5L-6L), Caste certificate, and Aadhaar Card.";
          fallbackSuggestions = ["Am I eligible for Central Sector Scheme?", "What are MP Board specific scholarships?"];
        } else if (query.toLowerCase().includes("farmer") || query.toLowerCase().includes("kisan")) {
          fallbackText = "**Farmer Subsidies & Schemes:**\\n\\n1. **PM-KISAN**: Direct income support of ₹6,000/year (3 installments of ₹2,000).\\n2. **PM-KUSUM**: 60% subsidy for setting up solar irrigation pumps.\\n3. **Kisan Credit Card (KCC)**: Collateral-free farm loan limit up to ₹1.6 Lakh (interest effectively 4%).\\n\\n*Key Requirement:* Land ownership certificate (Khatauni/B1) is mandatory.";
          fallbackSuggestions = ["How to apply for PM Kusum?", "Check loan limits for KCC"];
        } else {
          fallbackText = "I am currently running in offline simulation mode, but I can answer questions about education, farming, and startup schemes. Try asking about 'scholarships for students' or 'subsidies for farmers'!";
          fallbackSuggestions = ["Show student scholarships", "Show farmer subsidies"];
        }
      }

      // Format line breaks properly from simulator text
      const cleanFallback = fallbackText.replace(/\\n/g, '\n')
      setMessages(prev => [...prev, { role: 'model', content: cleanFallback }])
      setSuggestions(fallbackSuggestions)
    } finally {
      setLoading(false)
    }
  }

  const [errorState, setErrorState] = useState<string | null>(null)

  const startListening = () => {
    if (!recognitionRef.current) {
      setErrorState(t.voiceError)
      return
    }
    setErrorState(null)
    setIsListening(true)
    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-140px)]">
      
      {/* Container */}
      <div className="flex-grow glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {t.advisorTitle}
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.advisorSubtitle}</p>
          </div>
          
          {/* Quick Clear history button */}
          <button
            onClick={() => setMessages([{ role: 'model', content: lang === 'hi' ? t.hindiWelcomeMsg : t.welcomeMsg }])}
            className="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            title="Clear Chat History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isUser ? 'bg-brand-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {isUser ? 'U' : 'AI'}
                </div>
                
                {/* Bubble */}
                <div className={`p-4 rounded-2xl ${isUser ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/20 dark:border-slate-700/20'}`}>
                  {renderFormattedMessage(msg.content)}
                </div>
              </div>
            )
          })}
          
          {/* AI Loader bubble */}
          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none border border-slate-200/20 dark:border-slate-700/20 flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                <span className="text-xs font-semibold">SchemeAI is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef}></div>
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200/30 dark:border-slate-800/30 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSendMessage(s)}
                disabled={loading}
                className="text-xs font-bold py-1.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/30 dark:border-slate-700/30 text-slate-600 dark:text-slate-300 transition shrink-0 whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
          {errorState && (
            <div className="px-4 py-2 mb-2 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
              {errorState}
            </div>
          )}

          <div className="flex items-center gap-2">
            
            {/* Input field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
              placeholder={t.inputPlaceholder}
              className="flex-grow px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-primary disabled:opacity-50"
            />

            {/* Voice Rec Button */}
            {isListening ? (
              <button
                onClick={stopListening}
                className="p-3 bg-red-500 text-white rounded-xl pulse-ring shrink-0"
                title="Stop listening"
              >
                <MicOff className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startListening}
                disabled={loading}
                className="p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-xl shrink-0 disabled:opacity-50"
                title="Start Voice Input"
              >
                <Mic className="w-5 h-5 text-brand-primary" />
              </button>
            )}

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl shadow-neon-indigo hover:opacity-95 transition shrink-0 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}

export default ChatAssistant
