// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media', // Automatically switch based on user's preference (media query)

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',  // Add this to scan JS/TSX files
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1f4f3d',  // Primary color
        secondary: '#f5f5f5', // Secondary color (light theme)
        black: '#000000',
        white: '#ffffff',
        success: '#4caf50',
        danger: '#f44336',
        warning: '#ff9800',
        info: '#2196f3',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],  // Adding Outfit font
      },
      fontSize: {
        sm: '12px', // Smallest font size set to 12px
        // You can add other font sizes here
      },
    },
  },
  plugins: [],
}
