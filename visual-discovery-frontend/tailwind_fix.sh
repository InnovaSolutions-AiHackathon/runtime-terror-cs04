#!/usr/bin/env bash
set -e

echo "🔧 Fixing Tailwind styles..."

# ── 1. Fix tailwind.config.ts ──────────────────────────────
cat > tailwind.config.ts << 'ENDOFFILE'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
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

# ── 2. Fix postcss.config.js ──────────────────────────────
cat > postcss.config.js << 'ENDOFFILE'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
ENDOFFILE

# ── 3. Fix globals.css ─────────────────────────────────────
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

# ── 4. Ensure layout.tsx imports globals.css ───────────────
cat > src/app/layout.tsx << 'ENDOFFILE'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visual Discovery",
  description: "Find products by photo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
ENDOFFILE

# ── 5. Clear Next.js cache & reinstall ────────────────────
echo "🧹 Clearing cache..."
rm -rf .next
npm install --legacy-peer-deps

echo ""
echo "✅ Styles fixed! Now run:"
echo "   npm run dev"
echo ""
echo "🌐 Open: http://localhost:3000"
