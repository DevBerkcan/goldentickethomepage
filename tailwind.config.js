module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sweets aus aller Welt Farbschema
        primary: {
          pink: '#FF1493',      // Deep Pink - Hauptfarbe
          lightpink: '#FFB6C1', // Light Pink
          hotpink: '#FF69B4',   // Hot Pink
        },
        secondary: {
          turquoise: '#00CED1', // Türkis - Akzentfarbe
          cyan: '#40E0D0',      // Medium Turquoise
          lightcyan: '#E0F7FA', // Light Cyan
        },
        accent: {
          gold: '#FFD700',      // Gold
          yellow: '#FFDB58',    // Sunny Yellow
          orange: '#FFA500',    // Orange
        },
        brand: {
          red: '#DC143C',       // Crimson Red
          white: '#FFFFFF',     // White
          cream: '#FFFAF0',     // Floral White
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Montserrat', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Poppins', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}