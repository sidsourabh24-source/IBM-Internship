/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f5f7fb',
          dark: '#0b0f19',
          cardLight: 'rgba(255, 255, 255, 0.7)',
          cardDark: 'rgba(17, 24, 39, 0.7)',
          primary: '#3b82f6', // Sapphire Blue
          secondary: '#6366f1', // Royal Indigo
          accent: '#10b981', // Emerald green for eligible
          warning: '#f59e0b', // Amber for partially eligible
          danger: '#ef4444', // Crimson for not eligible
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2), 0 0 10px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.6), 0 0 25px rgba(99, 102, 241, 0.4)' },
        }
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'neon-indigo': '0 0 15px rgba(99, 102, 241, 0.5)',
      }
    },
  },
  plugins: [],
}
