/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // No dark mode — deliberate product decision (Frontend Spec §2)
  darkMode: false,
  theme: {
    extend: {
      // ── Color palette (Frontend Spec §2) ──────────────────────────────
      colors: {
        canvas:  '#F6F4EF', // App background — warm, unbleached-cotton neutral
        surface: '#FDFCFA', // Cards and elevated panels
        ink:     '#211F1C', // Primary text, headings, high-emphasis icons
        indigo:  '#2B3A67', // Primary actions, links, focus rings, selected states
        brass:   '#A87C35', // Secondary accent — favorites, success states (never body text)
        brick:   '#B23A34', // Errors, destructive actions
        line:    '#E2DCD0', // Borders, dividers, resting-state card outlines
      },

      // ── Font families (Frontend Spec §2) ─────────────────────────────
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'], // Headings / hero moments
        body:    ['"Work Sans"', 'sans-serif'],           // UI / reading text
        mono:    ['"IBM Plex Mono"', 'monospace'],        // Garment-tag chips
      },

      // ── Spacing scale: 4px base unit (Frontend Spec §2) ──────────────
      // Tailwind's defaults already cover 4/8/12/16/24/32/48/64/96 — no override needed.

      // ── Border radius tokens (Frontend Spec §2) ──────────────────────
      borderRadius: {
        tag:   '6px',   // Tags / chips — tighter, label-like
        card:  '8px',   // Cards / buttons / inputs
        modal: '12px',  // Modals
        full:  '999px', // Icon buttons / avatars
      },

      // ── Box shadow (Frontend Spec §2) ────────────────────────────────
      boxShadow: {
        lift: '0 4px 12px rgba(33, 31, 28, 0.08)', // Hover lift for cards
        nav:  '0 2px 8px rgba(33, 31, 28, 0.06)',  // Scrolled navbar
      },

      // ── Type scale utilities via fontSize (Frontend Spec §2) ─────────
      fontSize: {
        'display-xl': ['56px', { lineHeight: '1.1',  fontWeight: '600' }],
        'display-l':  ['40px', { lineHeight: '1.15', fontWeight: '600' }],
        'h1':         ['28px', { lineHeight: '1.25', fontWeight: '500' }],
        'h2':         ['22px', { lineHeight: '1.3',  fontWeight: '500' }],
        'body-lg':    ['17px', { lineHeight: '1.5',  fontWeight: '400' }],
        'body':       ['15px', { lineHeight: '1.5',  fontWeight: '400' }],
        'caption':    ['13px', { lineHeight: '1.4',  fontWeight: '500' }],
        'tag':        ['11px', { lineHeight: '1.2',  fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
