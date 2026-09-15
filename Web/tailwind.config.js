/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#0B1220',         // Header / fondo oscuro
        'brand-bg': '#F8FAFC',           // Fondo principal (slate-50)
        'brand-surface': '#FFFFFF',      // Tarjetas / superficies (blanco)
        'brand-action': '#1E3A8A',       // Botones / elementos destacados (azul acción)
        'brand-action-hover': '#172554', // Hover para botones (azul marino profundo)
        'brand-dark': '#1E293B',         // Texto secundario / controles / texto principal (slate-800)
        'brand-muted': '#F1F5F9',        // Bordes / fondos secundarios (slate-100)
        'brand-border': '#E2E8F0',       // Bordes sutiles en tarjetas / inputs (slate-200)
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
}
