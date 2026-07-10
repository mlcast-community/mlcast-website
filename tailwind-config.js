// Shared Tailwind (Play CDN) theme — single source of truth for every page.
// Load right after the cdn.tailwindcss.com script so the config is set before
// classes are generated: <script src="tailwind-config.js"></script>.
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#005B63",
                "primary-fixed": "#EE964B",
                "background": "#FFFFFF",
                "surface-container": "#F7EDE2",
                "surface-container-high": "#F0E8DE",
                "on-surface": "#005B63",
                "on-surface-variant": "#6B7F82",
                "on-primary-fixed": "#FFFFFF",
                "outline-variant": "#E8DDD4",
                "accent-2": "#F4D35E",
                "surface-creme": "#F7EDE2"
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
            spacing: {
                "md": "16px",
                "lg": "24px",
                "xl": "40px",
                "sm": "8px",
                "margin-mobile": "16px",
                "margin-desktop": "48px"
            },
            fontFamily: {
                "sans": ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
                "headline-xl": ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
                "body-lg": ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
                "mono": ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
                "label-tag": ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
            }
        }
    }
};
