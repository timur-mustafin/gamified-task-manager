/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🌞 Light mode tokens
        surface: '#f8f9fa',              // lighter than white for page background
        main: '#1f2937',                 // gray-800
        subtle: '#6b7280',               // gray-500
        accent: '#2563eb',              // blue-600
        button: '#10b981',              // emerald-500
        buttonText: '#ffffff',
        buttonHover: '#059669',         // emerald-600
        border: '#e5e7eb',              // gray-200

        // 🌙 Dark mode tokens
        'surface-dark': '#1e293b',       // new: dark container bg (same as dropdown)
        'dark-blue': '#0b0f19',          // darkblue
        'main-dark': '#f9fafb',          // gray-50
        'subtle-dark': '#9ca3af',        // gray-400
        'accent-dark': '#3b82f6',        // blue-500
        'button-dark': '#34d399',        // emerald-400
        'buttonText-dark': '#1f2937',    // almost black
        'button-hover-dark': '#22c55e',  // emerald-500
        'border-dark': '#334155',        // dark border for containers
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.06)',
      },
      transitionProperty: {
        bg: 'background-color',
        text: 'color',
      },
    }
  },
  plugins: [],
}
