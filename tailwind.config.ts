import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: 'var(--brand-purple)',
          gold: 'var(--brand-gold)',
          teal: 'var(--brand-teal)',
          surface: 'var(--brand-surface)',
          text: 'var(--brand-text)',
          muted: 'var(--brand-muted)'
        }
      },
      boxShadow: {
        premium: '0 24px 70px rgba(26, 18, 54, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
