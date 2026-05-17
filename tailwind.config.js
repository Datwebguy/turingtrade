/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#06050F',
        surface:  '#0D0C1E',
        surface2: '#15132A',
        border:   '#1F1C3A',
        primary:  '#E8B84B',
        success:  '#39FF14',
        danger:   '#FF3366',
        ai:       '#FF3366',
        human:    '#4DFFEA',
        text:     '#F0EBE3',
        muted:    '#6B6589',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['Syne', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
