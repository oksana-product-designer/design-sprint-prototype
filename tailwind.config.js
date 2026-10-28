/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#0975e2',
          light: '#3f99f3',
        },
        // Surfaces
        'surface-bg': '#f6f6f6',
        // Text
        'text-primary': '#2c2c2c',
        'text-secondary': '#64748b',
        'text-heading': '#0f172a',
        'text-col-header': '#4c5c72',
        'text-link': '#0975e2',
        // Borders
        'border-default': '#d9d9d9',
        'border-row': '#e2e2e2',
        // Stat icon backgrounds
        'stat-blue': '#0975e2',
        'stat-red': '#da3535',
        'stat-orange': '#fb8524',
        'stat-purple': '#b024fb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ds-xs': ['12px', { lineHeight: '16px' }],
        'ds-sm': ['14px', { lineHeight: '20px' }],
        'ds-base': ['16px', { lineHeight: '24px' }],
        'ds-lg': ['24px', { lineHeight: '24px' }],
        'ds-stat': ['32px', { lineHeight: '32px' }],
      },
      height: {
        header: '80px',
        row: '56px',
      },
      borderRadius: {
        'ds-sm': '4px',
        'ds-md': '8px',
        'ds-pill': '9999px',
      },
      boxShadow: {
        table: '0px 2px 4px rgba(0,0,0,0.08)',
      },
      letterSpacing: {
        'logo': '-0.48px',
      },
    },
  },
  plugins: [],
}
