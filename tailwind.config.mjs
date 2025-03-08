/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{mjs,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            },
            'code:not(pre code)': {
              backgroundColor: '#f0f5ff',
              color: '#1a56db',
              borderRadius: '0.3rem',
              padding: '0.2rem 0.4rem',
              border: '1px solid #d1ddf5',
              fontSize: '0.9em',
              fontWeight: 'normal',
              whiteSpace: 'pre-wrap'
            }
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
