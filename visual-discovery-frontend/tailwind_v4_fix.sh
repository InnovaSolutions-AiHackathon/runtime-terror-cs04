#!/usr/bin/env bash
set -e

echo "🔧 Fixing Tailwind v4 setup..."

# ── 1. Install the new PostCSS plugin for Tailwind v4 ─────
npm install @tailwindcss/postcss --save-dev --legacy-peer-deps

# ── 2. Fix postcss.config.js for v4 ──────────────────────
cat > postcss.config.js << 'ENDOFFILE'
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
ENDOFFILE

# ── 3. Fix globals.css for v4 (no more @tailwind directives)
cat > src/app/globals.css << 'ENDOFFILE'
@import "tailwindcss";

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

# ── 4. tailwind.config.ts is NOT needed in v4 — remove it
rm -f tailwind.config.ts

# ── 5. Clear cache ─────────────────────────────────────────
rm -rf .next

echo ""
echo "✅ Done! Now run:"
echo "   npm run dev"
echo ""
echo "🌐 Open: http://localhost:3000"
