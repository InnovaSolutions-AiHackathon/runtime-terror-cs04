#!/usr/bin/env bash
set -e

echo "🔧 Downgrading to Tailwind v3 (stable)..."

# ── 1. Remove current tailwind & postcss installs ─────────
npm uninstall tailwindcss @tailwindcss/postcss postcss autoprefixer

# ── 2. Install Tailwind v3 with correct postcss ───────────
npm install -D tailwindcss@3 postcss autoprefixer --legacy-peer-deps

# ── 3. Restore postcss.config.js for v3 ──────────────────
cat > postcss.config.js << 'ENDOFFILE'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
ENDOFFILE

# ── 4. Restore tailwind.config.ts for v3 ─────────────────
cat > tailwind.config.ts << 'ENDOFFILE'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
ENDOFFILE

# ── 5. Restore globals.css for v3 ────────────────────────
cat > src/app/globals.css << 'ENDOFFILE'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #f9fafb;
  -webkit-font-smoothing: antialiased;
}
ENDOFFILE

# ── 6. Clear cache and restart ────────────────────────────
rm -rf .next node_modules/.cache

echo ""
echo "✅ Tailwind v3 installed! Now run:"
echo "   npm run dev"
echo ""
echo "🌐 Open: http://localhost:3000"
