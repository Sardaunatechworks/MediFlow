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
        brand: {
          50: '#F4F8F5',
          100: '#E2E8E4',
          200: '#C4D4C9',
          300: '#98B5A2',
          400: '#4D8863',
          500: '#177843',
          600: '#006B35', // Primary Green (Figma)
          700: '#004D27', // Dark Green (Figma)
          800: '#003D20', // Deep Sidebar Green (Figma)
          900: '#002915',
        },
        sidebar: {
          DEFAULT: '#003D20', // Deep Green
          hover: 'rgba(255, 255, 255, 0.08)',
          active: '#006B35', // Primary Green active state
          text: '#CFDFD6',
          muted: '#8CA696',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F4F8F5',
          subtle: '#EBF1ED',
        },
        app: {
          bg: '#F4F8F5', // Light Green-Tinted Background
          border: '#E2E8E4', // Figma Border
          text: '#17201B', // Figma Primary Text
          secondary: '#66736C', // Figma Secondary Text
        },
        urgency: {
          red: {
            bg: '#FCE8E6',
            border: '#F8B4B4',
            text: '#C5221F',
            badge: '#DC2626',
          },
          yellow: {
            bg: '#FEFCE8',
            border: '#FDE047',
            text: '#B45309',
            badge: '#EAB308',
          },
          green: {
            bg: '#EAF7EE',
            border: '#A3D9B1',
            text: '#0F6932',
            badge: '#16A34A',
          },
        },
      },
      borderRadius: {
        control: '8px',
        card: '12px',
        modal: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        modal: '0 16px 32px -4px rgba(0, 0, 0, 0.12), 0 6px 12px -4px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
