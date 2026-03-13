import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#09090F',
          surface: '#12122A',
          card: '#1C1C3A',
          hover: '#242448',
        },
        primary: {
          DEFAULT: '#FF6B9D',
          hover: '#FF4D88',
          muted: 'rgba(255,107,157,0.15)',
        },
        secondary: {
          DEFAULT: '#FF8C42',
          hover: '#FF7A28',
          muted: 'rgba(255,140,66,0.15)',
        },
        gold: {
          DEFAULT: '#FFD700',
          muted: 'rgba(255,215,0,0.15)',
        },
        online: '#4ADE80',
        border: 'rgba(255,255,255,0.08)',
        text: {
          primary: '#F0F0FF',
          secondary: '#9090B0',
          muted: '#5A5A7A',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF6B9D 0%, #FF8C42 100%)',
        'gradient-hero': 'linear-gradient(135deg, #09090F 0%, #1A0D2E 50%, #0D1A2E 100%)',
        'gradient-card': 'linear-gradient(180deg, rgba(28,28,58,0) 0%, rgba(28,28,58,0.95) 100%)',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        primary: '0 4px 20px rgba(255,107,157,0.4)',
        gold: '0 4px 20px rgba(255,215,0,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
