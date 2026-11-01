/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050811',
        abyss: '#03050b',
        holo: {
          DEFAULT: '#2ee6ff',
          dim: '#0e7f95',
          ghost: '#0a3d4a',
        },
        amber: {
          glow: '#ffb02e',
          incense: '#ffcf6b',
        },
        danger: '#ff4d5e',
        moss: '#7da87b',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'holo-flicker': 'holoFlicker 4s linear infinite',
        'scanline': 'scanline 8s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        holoFlicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.6' },
          '94%': { opacity: '0.95' },
          '96%': { opacity: '0.7' },
          '97%': { opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
