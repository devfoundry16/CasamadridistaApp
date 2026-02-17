/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Real Madrid Brand Colors
        'rm-gold': '#BC9045',
        'rm-white': '#FFFFFF',
        'rm-navy': '#001F3F',
        
        // Background shades
        'bg-dark': '#0A0A0A',
        'bg-deep-dark': '#1A1A1A',
        'bg-medium': '#2A2A2A',
        'bg-card': '#2F2F2F',
        'bg-light': '#3A3A3A',
        'bg-gray': '#515151',
        
        // Text shades
        'text-primary': '#FFFFFF',
        'text-secondary': '#CCCCCC',
        'text-tertiary': '#A0A0A0',
        'text-muted': '#666666',
        'text-dark': '#1A1A1A',
        
        // Border shades
        'border-default': '#3A3A3A',
        'border-light': '#4A4A4A',
        'border-medium': '#E0E0E0',
        
        // Status colors
        'status-success': '#10B981',
        'status-error': '#EF4444',
        'status-warning': '#F59E0B',
        'status-info': '#0033A0',
      },
      fontFamily: {
        cairo: ["Cairo_400Regular"],
        "cairo-bold": ["Cairo_700Bold"],
      },
    },
  },
  plugins: [],
}