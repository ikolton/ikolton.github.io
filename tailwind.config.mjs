/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {
            colors: {
                accent: {
                    DEFAULT: "#0f766e",
                    dark: "#5eead4",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
                mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
};
