import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        cream: {
          50: '#fdfbf7',
          100: '#fdf9f0',
          200: '#fcf4d9',
          300: '#f9e8b3',
          400: '#f4db82',
        },
        ink: {
          50: '#f7f9f8',
          100: '#edf1ee',
          200: '#d9e1dc',
          300: '#b9c7bf',
          400: '#8da197',
          500: '#687c72',
          600: '#4d6157',
          700: '#3a4b43',
          800: '#27352f',
          900: '#16211c',
          950: '#0a1410',
        },
        coral: {
          50: '#fff4f1',
          100: '#ffe5dd',
          200: '#ffcab8',
          300: '#ffa88c',
          400: '#ff7a55',
          500: '#f2552c',
          600: '#d93a11',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 50px -24px rgba(6, 78, 59, 0.25)',
        glow: '0 0 0 1px rgba(52, 211, 153, 0.25), 0 24px 70px -28px rgba(16, 185, 129, 0.45)',
      },
      backgroundImage: {
        'grid-emerald':
          'linear-gradient(to right, rgba(52,211,153,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(52,211,153,0.08) 1px, transparent 1px)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgba(245, 158, 11, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
        },
        'scan-line': {
          '0%': { top: '8%' },
          '50%': { top: '86%' },
          '100%': { top: '8%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        float: 'float 5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'scan-line': 'scan-line 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
