/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B91C1C',
          light: '#DC2626',
          dark: '#991B1B',
        },
        secondary: {
          DEFAULT: '#15803D',
          light: '#16A34A',
          dark: '#166534',
        },
        accent: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          dark: '#B45309',
        },
        snow: '#FAFAFA',
      },
      // Prevent bare `border` class from inheriting currentColor on Android
      // (which becomes red when the surrounding text color is the primary red).
      borderColor: {
        DEFAULT: '#E5E7EB', // gray-200
      },
      fontSize: {
        'festive-sm': ['14px', { lineHeight: '20px', letterSpacing: '0.2px' }],
        'festive-base': ['16px', { lineHeight: '24px', letterSpacing: '0.2px' }],
        'festive-lg': ['18px', { lineHeight: '28px', letterSpacing: '0.3px' }],
        'festive-xl': ['20px', { lineHeight: '28px', letterSpacing: '0.4px' }],
        'festive-2xl': ['24px', { lineHeight: '32px', letterSpacing: '0.5px' }],
        'festive-3xl': ['30px', { lineHeight: '36px', letterSpacing: '0.5px' }],
      },
    },
  },
  plugins: [],
};
