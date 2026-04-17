/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'theme-bg':      'var(--theme-bg)',
        'theme-surface': 'var(--theme-surface)',
        'theme-card':    'var(--theme-card)',
        'theme-border':  'var(--theme-border)',
        'theme-text':    'var(--theme-text)',
        'theme-muted':   'var(--theme-muted)',
      },
      animation: {
        'orb-slow': 'orb-slow 20s ease-in-out infinite',
        'orb-slow-reverse': 'orb-slow-reverse 25s ease-in-out infinite',
        'orb-pulse': 'orb-pulse 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'gradient-x': 'gradient-x 8s ease infinite',
      },
      keyframes: {
        'orb-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'orb-slow-reverse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-30px, 30px) scale(1.08)' },
          '66%': { transform: 'translate(20px, -20px) scale(0.92)' },
        },
        'orb-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249,115,22,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(249,115,22,0.6)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
      },
      boxShadow: {
        'glow-orange': '0 0 40px rgba(249,115,22,0.25)',
        'glow-red': '0 0 40px rgba(239,68,68,0.25)',
        'glow-purple': '0 0 40px rgba(168,85,247,0.25)',
        'card': '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 20px 40px -12px rgba(0,0,0,0.35)',
        'premium': '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        'premium-light': '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-dark': 'linear-gradient(to bottom right, rgba(17,24,39,0.9), rgba(10,10,14,0.95))',
      },
    },
  },
  plugins: [],
};
