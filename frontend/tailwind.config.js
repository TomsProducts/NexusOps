/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: "#050912",
        panelDark: "#0b1220",
        panel2Dark: "#0e1727",
        lineDark: "#1b2b43",
        cyberCyan: "#19d9ff",
        cyberBlue: "#3f7cff",
        cyberPurple: "#8c5cff",
        cyberGreen: "#27e29b",
        cyberYellow: "#ffc857",
        cyberRed: "#ff4d6d",
        cyberOrange: "#ff8a3d",
      },
      boxShadow: {
        glow: "0 0 24px rgba(25, 217, 255, 0.12)",
        glowRed: "0 0 24px rgba(255, 77, 109, 0.18)",
        glowGreen: "0 0 24px rgba(39, 226, 155, 0.18)",
      }
    },
  },
  plugins: [],
};
