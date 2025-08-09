
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: { '2xl': '1.25rem' },
      colors: {
        bg: "hsl(250 16% 98%)",
        card: "hsl(0 0% 100%)",
        text: "hsl(222 47% 11%)"
      }
    },
  },
  plugins: [],
}
