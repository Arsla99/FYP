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
        'bg-base':       'var(--bg-base)',
        'bg-elevated':   'var(--bg-elevated)',
        'bg-surface':    'var(--bg-surface)',
        'bg-hover':      'var(--bg-hover)',
        'bg-pressed':    'var(--bg-pressed)',
        'accent-gold':   'var(--accent-gold)',
        'accent-gold-light': 'var(--accent-gold-light)',
        'accent-coral':  'var(--accent-coral)',
        'accent-emerald':'var(--accent-emerald)',
        'accent-blue':   'var(--accent-blue)',
        'accent-purple': 'var(--accent-purple)',
        'text-primary':  'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted':    'var(--text-muted)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      boxShadow: {
        'glow-gold': 'var(--shadow-glow-gold)',
        'glow-coral': 'var(--shadow-glow-coral)',
        'glow-emerald': 'var(--shadow-glow-emerald)',
        'card': 'var(--shadow-2)',
        'card-hover': 'var(--shadow-3)',
        'elevated': 'var(--shadow-3)',
        'modal': 'var(--shadow-4)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'scale-in': 'scale-in 0.35s ease-out both',
        'slide-in-right': 'slide-in-right 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 3s ease-in-out infinite',
        'float-y': 'float-y 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.5' },
          '50%': { transform: 'scale(1.05)', opacity: '0.15' },
          '100%': { transform: 'scale(0.95)', opacity: '0.5' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
