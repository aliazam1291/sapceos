// Tailwind v4 runs through PostCSS alongside the existing SCSS-module pipeline.
// It is here for the Aceternity-style components only; page layout stays SCSS.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
