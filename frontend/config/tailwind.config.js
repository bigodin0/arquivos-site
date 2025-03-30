/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores antigas (mantidas para compatibilidade durante a transição)
        'primary-old': '#0EA47A',
        'primary-dark-old': '#0B8C6C',
        'secondary-old': '#F5F7FF',
        'simulachat-whatsapp': '#25D366',
        
        // Nova paleta premium - Teal & Grey
        'primary': {
          DEFAULT: '#00A19D',
          50: '#E6F7F7', 
          100: '#CCEFEF',
          200: '#99DFDE',
          300: '#66CFCE',
          400: '#33BFBD',
          500: '#00A19D',
          600: '#00817E',
          700: '#00615E',
          800: '#00403F',
          900: '#00201F',
        },
        'secondary': {
          DEFAULT: '#708091',
          50: '#F5F6F8',
          100: '#EBEDF1',
          200: '#D6DBE3',
          300: '#C2C9D5',
          400: '#ADB8C7',
          500: '#91A3B1',
          600: '#708091',
          700: '#536877',
          800: '#3D4D59',
          900: '#26313A',
        },
        'teal': {
          DEFAULT: '#00A19D',
          dark: '#008082'
        },
        'grey': {
          light: '#91A3B1',
          DEFAULT: '#708091',
          dark: '#536877'
        },
        
        // Cores de suporte
        'success': '#00B894',
        'warning': '#FDCB6E',
        'error': '#FF7675',
        
        // Cores neutras refinadas
        'text': {
          dark: '#2D3748',
          medium: '#4A5568',
          light: '#718096',
        },
        'bg': {
          dark: '#EDF2F7',
          light: '#F7FAFC',
        }
      },
      fontFamily: {
        'sans': ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display': ['"Montserrat"', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '1rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'premium': '0 10px 25px -5px rgba(0, 161, 157, 0.2), 0 8px 10px -5px rgba(0, 161, 157, 0.1)',
        'premium-dark': '0 10px 25px -5px rgba(0, 128, 130, 0.3), 0 8px 10px -5px rgba(0, 128, 130, 0.15)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 12px 24px rgba(0, 0, 0, 0.12)',
        'none': 'none',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-teal': 'pulseTeal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseTeal: {
          '0%, 100%': { 
            backgroundColor: '#E6F7F7',
            boxShadow: '0 0 0 0 rgba(0, 161, 157, 0.7)' 
          },
          '50%': { 
            backgroundColor: '#CCEFEF',
            boxShadow: '0 0 0 10px rgba(0, 161, 157, 0)' 
          },
        },
      },
      // Outras extensões
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, #00A19D 0%, #008082 100%)',
      },
    },
  },
  plugins: [],
}