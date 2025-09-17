import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        // Palette extracted from 123.jpeg (soft whites, warm reds)
        brand: {
          primary: '#D23737', // rich red from crest
          primaryDark: '#B3262A',
          accent: '#F0D9C3', // warm beige from text
          light: '#F5F3F1', // near white
          dark: '#0B0B0C', // near black background
        },
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}

export default config


