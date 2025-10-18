/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'cinema-black': '#0a0a0a',
        'cinema-darker': '#121212',
        'cinema-dark': '#1a1a1a',
        'cinema-gray': '#2a2a2a',
        'cinema-light': '#3a3a3a',
        'neon-cyan': '#00d9ff',
        'neon-blue': '#0099ff',
        'neon-purple': '#b366ff',
        'accent-red': '#ff0050',
      },
      backgroundImage: {
        'gradient-cinema': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        'gradient-neon': 'linear-gradient(135deg, #00d9ff 0%, #0099ff 50%, #b366ff 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 217, 255, 0.3)',
        'neon-lg': '0 0 30px rgba(0, 217, 255, 0.4)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
