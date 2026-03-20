# 🔍 Visual Discovery — Frontend

> **Team Runtime Terror** · Hackathon 2026

Next.js frontend for the Visual Discovery AI-powered fashion search platform.

## Features
- 📸 Photo upload, drag & drop, camera, URL paste
- 🔍 Visual search results with match scores
- 🧩 Complete the Look — outfit suggestions
- 🔄 Smart Swaps — better value alternatives

## Tech Stack
- Next.js 14 (App Router)
- React 18
- Tailwind CSS v3
- TypeScript

## Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Run with Docker

```bash
docker build -t visual-discovery-ui .
docker run -p 3000:3000 visual-discovery-ui
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Backend
See [visual-discovery-backend](../visual-discovery-backend) for the FastAPI + ML backend.

---

Built with ⚡ by **Runtime Terror**