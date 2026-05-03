import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas:     '#07090d',
        panel:      '#0d1117',
        'panel-hi': '#131920',
        // Brand primaries — exact spec (use with paper/white text on filled backgrounds)
        sapphire:   '#1D3A8A',
        ruby:       '#C41E3A',
        paper:      '#FAFAF7',
        // Functional accents — bright enough for text/borders on dark backgrounds
        accent:     '#5B8DEF',   // bright sapphire — buy orders, primary CTAs, progress
        'accent-2': '#4A7EE8',
        sell:       '#E05575',   // bright ruby — sell order labels and actions
        // Semantic
        ink:        '#e6edf3',
        dim:        '#7d8590',
        danger:     '#f85149',
        caution:    '#e3b341',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
