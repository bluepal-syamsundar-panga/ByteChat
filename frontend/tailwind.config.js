/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slack: {
          sidebar: '#3F0E40',
          sidebarHover: '#350D36',
          activeChannel: '#1164A3',
          messageBg: '#FFFFFF',
          appBg: '#F8F8F8',
          textPrimary: '#1D1C1D',
          onlineDot: '#2BAC76',
          unreadBadge: '#E01E5A',
        }
      }
    },
  },
  plugins: [],
}
