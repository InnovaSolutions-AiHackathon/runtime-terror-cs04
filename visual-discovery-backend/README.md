# 🔍 Visual Discovery — AI-Powered Fashion Search

> **Team Runtime Terror** · Hackathon 2026

Transform the retail journey from keyword search to visual discovery. Upload any fashion photo and our AI pipeline finds visually similar products, builds a complete outfit, and suggests smarter alternatives.

---

## 🎯 Problem Statement

Traditional ecommerce search is **keyword-based** — users must describe what they want in words. This creates a "vocabulary gap" where users see a product they love but can't describe it precisely enough to find it.

**Visual Discovery solves this** — users simply show the app what they want.

---

## ✨ Features

- 📸 **Photo Upload / Camera / URL** — search with any image
- 🎯 **Object Detection** — identifies multiple items in one photo (bag + shoes + watch)
- 🔍 **Visual Search** — finds products by visual similarity, not keywords
- 🧩 **Complete the Look** — suggests complementary items to build a full outfit
- 🔄 **Smart Swaps** — finds better-priced or higher-rated alternatives with same style
- ⚡ **44,000 Products** — real fashion catalog with AI-powered embeddings
- 🐳 **100% Local** — runs entirely in Docker, zero cloud cost

---

## 🏗️ Architecture

```
User uploads photo
      ↓
Next.js Frontend (port 3000)
      ↓ POST /search
FastAPI Backend (port 8000)
      ↓
YOLO v8 ──────────────── detects & crops objects
      ↓
CLIP ViT-B/32 ─────────── converts image to 512-dim vector
      ↓
Weaviate (port 8080) ──── finds nearest neighbor products
      ↓
Style Engine ──────────── complements + smart swaps
      ↓
Results displayed in UI
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| Object Detection | YOLOv8 nano (Ultralytics) |
| Image Embedding | CLIP ViT-B/32 (OpenCLIP) |
| Vector Database | Weaviate 1.25 |
| Cache | Redis 7 |
| Dataset | Kaggle Fashion Product Images (44k) |
| Container | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Python 3.11
- Node.js 20 LTS
- 16GB RAM
- 40GB free disk space

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/visual-discovery.git
cd visual-discovery
```

### 2. Download the dataset
```bash
pip install kaggle
kaggle datasets download -d paramaggarwal/fashion-product-images-small
```

### 3. Start all services
```bash
docker compose up --build
```

### 4. Ingest the catalog (first time only)
```bash
cd visual-discovery-backend
python ingest_kaggle.py --zip "/path/to/fashion-product-images-small.zip"
```

### 5. Open the app
```
http://localhost:3000
```

---

## 📁 Project Structure

```
visual-discovery/                  ← Next.js Frontend
├── src/app/
│   ├── page.tsx                   ← App shell
│   ├── components/
│   │   ├── UploadScreen.tsx       ← Photo upload
│   │   ├── ResultsScreen.tsx      ← Search results
│   │   ├── StyleBoardScreen.tsx   ← Outfit builder
│   │   └── shared.tsx             ← UI components
│   └── globals.css
└── src/lib/
    └── mockData.ts                ← API calls

visual-discovery-backend/          ← FastAPI Backend
├── app/
│   ├── main.py                    ← API routes
│   ├── services/
│   │   ├── clip_service.py        ← Image embedding
│   │   ├── yolo_service.py        ← Object detection
│   │   ├── weaviate_service.py    ← Vector search
│   │   └── style_service.py       ← Style recommendations
│   └── models/schemas.py          ← Data models
├── ingest_kaggle.py               ← Dataset ingestion
├── docker-compose.yml             ← All services
└── Dockerfile                     ← Backend container
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/search` | Visual search by image upload |
| POST | `/search-by-url` | Visual search by image URL |
| GET | `/styleboard/{id}` | Get complements + smart swaps |
| POST | `/catalog/ingest` | Ingest product catalog |
| DELETE | `/catalog/clear` | Clear catalog |

API docs available at: `http://localhost:8000/docs`

---

## 🧠 How It Works

### Visual Search Pipeline
1. **YOLO** detects and crops individual objects from the uploaded photo
2. **CLIP** converts each cropped image into a 512-dimensional vector
3. **Weaviate** finds the nearest neighbor vectors using HNSW algorithm
4. Results ranked by cosine similarity score

### Smart Swap Scoring
```
score = (price_saving × 0.4) + (rating/5.0 × 0.4) + (promo_active × 0.2)
```

### Style Affinity
Category-based complement mapping ensures relevant outfit suggestions:
- Apparel → Footwear + Accessories
- Footwear → Bottomwear + Accessories
- Accessories → Apparel + Footwear

---

## 📊 Performance

| Metric | Value |
|---|---|
| Catalog size | 44,000 products |
| Search latency (CPU) | ~2-4 seconds |
| Search latency (GPU) | ~300ms |
| CLIP embedding dim | 512 |
| YOLO model size | 6MB |
| Match accuracy | 85-90% category correct |

---

## 👥 Team

**Runtime Terror**

Built with ⚡ at Hackathon 2025

---

## 📄 License

MIT License — free to use and modify.