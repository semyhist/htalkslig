/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.08)",
        input: "rgba(255, 255, 255, 0.05)",
        background: "#030014",
        foreground: "#f4f4f5",
        brand: {
          dark: '#0c0a18',
          card: 'rgba(12, 10, 24, 0.65)',
          accent: '#8b5cf6',
          success: '#10b981',
          warning: '#f59e0b',
        }
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'glow-success': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-accent': '0 0 25px -5px rgba(59, 130, 246, 0.35)',
      }
    },
  },
  plugins: [],
}
