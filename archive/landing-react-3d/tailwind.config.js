/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38bdf8',
          500: '#0070f3',
          600: '#0066ff',
          700: '#0047d6',
          cyan: '#00c8ff',
          dark: '#0b132b',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 20px 50px -10px rgba(0, 112, 243, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.6)',
        'glass-hover': '0 25px 60px -12px rgba(0, 112, 243, 0.18), 0 0 0 1px rgba(0, 112, 243, 0.3)',
        'glow': '0 0 35px rgba(0, 200, 255, 0.35)',
        'btn-glow': '0 10px 25px -5px rgba(0, 112, 243, 0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
