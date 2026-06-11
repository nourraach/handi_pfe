/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Premium purple color palette
      colors: {
        primary: {
          50: '#f6f2ff',
          100: '#ede4ff',
          200: '#d8caf6',
          300: '#c6afea',
          400: '#a984d1',
          500: '#35063e',
          600: '#4c0d59',
          700: '#5f1a72',
          800: '#24042b',
        },
        purple: {
          50: '#f6f2ff',
          100: '#eee5ff',
          200: '#d8caf6',
          300: '#c7b1ea',
          400: '#ab8ad5',
          500: '#8f61ce',
          600: '#6d3ea5',
          700: '#4c0d59',
          800: '#35063e',
          900: '#24042b',
        },
        // Background colors
        bg: {
          primary: '#f6f2ff',
          soft: '#fbf8ff',
          white: '#ffffff',
        },
        // Text colors
        text: {
          primary: '#17111f',
          muted: '#6b7280',
        },
        // Border color
        border: 'rgba(53, 6, 62, 0.12)',
      },
      // Custom border-radius scale
      borderRadius: {
        'xl': '24px',
        'lg': '22px',
        'md': '18px',
        'sm': '16px',
        'full': '999px',
      },
      // Custom shadow scale
      boxShadow: {
        'soft': '0 16px 40px rgba(53, 6, 62, 0.08)',
        'mid': '0 24px 60px rgba(53, 6, 62, 0.15)',
        'strong': '0 34px 90px rgba(36, 4, 43, 0.24)',
      },
      // Custom font families
      fontFamily: {
        heading: ['var(--font-outfit)', '"Segoe UI"', 'sans-serif'],
        body: ['var(--font-plus-jakarta-sans)', '"Segoe UI"', 'sans-serif'],
      },
      // Spacing scale
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '34px',
        '2xl': '48px',
        '3xl': '58px',
      },
      // Responsive typography using clamp()
      fontSize: {
        'hero': 'clamp(2.15rem, 4.8vw, 4rem)',
        'h2': 'clamp(1.8rem, 3.2vw, 2.8rem)',
        'h3': 'clamp(1.5rem, 2.6vw, 2rem)',
        'body': '1rem',
        'small': '0.9rem',
        'tiny': '0.74rem',
      },
      // Animations
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
