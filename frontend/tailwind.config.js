/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#ff006e',
        'neon-blue': '#00d9ff',
        'glass-dark': 'rgba(0, 0, 0, 0.4)',
        'dark-bg': '#0a0a0a',
        'dark-purple': '#1a0a1a',
        'dark-blue': '#0a1a2a',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(135deg, #ff006e 0%, #00d9ff 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 25%, #0a1a2a 50%, #1a0a1a 75%, #0a0a0a 100%)',
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
        'neon-blue': '0 0 20px rgba(0, 217, 255, 0.5)',
        'neon-glow': '0 0 30px rgba(255, 0, 110, 0.6), 0 0 40px rgba(0, 217, 255, 0.4)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backdropBlur: {
        glass: '10px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        futuristic: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 0, 110, 0.4), 0 0 40px rgba(0, 217, 255, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(255, 0, 110, 0.6), 0 0 60px rgba(0, 217, 255, 0.4)',
          },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
};
