/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#121211",
        },
        bone: "#E7E1D5",
        ash: "#8E8B83",
        burgundy: "#B6382F",
        marker: "#E6D21F",
        violet: "#1598C2",
        hairline: "rgba(231,225,213,.22)",
      },
      fontFamily: {
        display: ["Alumni Sans", "Roboto Condensed", "Arial Narrow", "system-ui", "sans-serif"],
        sans: ["Roboto Condensed", "Arial Narrow", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(.25,.1,.25,1)",
        out: "cubic-bezier(.16,1,.3,1)",
      },
      zIndex: {
        base: "0",
        raised: "10",
        sticky: "30",
        nav: "40",
        overlay: "50",
        loader: "60",
      },
    },
  },
  plugins: [],
};
