# 🔍 Visual Discovery — AI-Powered Fashion Search

> **Team Runtime Terror** · Hackathon 2026

Transform the retail journey from keyword search to visual discovery. Upload any fashion photo, describe what you want in words, and our AI pipeline finds visually similar products, builds a complete outfit, and suggests smarter alternatives.

---

## 🎯 Problem Statement

Traditional ecommerce search is **keyword-based** — users must describe what they want in words. This creates a "vocabulary gap" where users see a product they love but can't describe it precisely enough to find it.

**Visual Discovery solves this** — users simply show or describe what they want.

---

## ✨ Features

- 📸 **Photo Upload / Camera / URL** — search with any image
- 💬 **Text Search** — describe what you want in words (e.g. "brown leather belt", "green salwar")
- 🕐 **Search History** — last 5 searches saved, re-search with one tap
- ❤️ **Wishlist** — save favourite products, view and manage anytime
- 🛒 **Add to Cart** — add products with quantity control and order summary
- 🎯 **Smart Filters** — filter by price range, rating, category
- 📊 **Sort Results** — sort by match %, price, or rating
- 🧩 **Complete the Look** — suggests complementary items by gender and style
- 🔄 **Smart Swaps** — finds better-priced or higher-rated alternatives
- ⭐ **Outfit Score** — AI scores your outfit out of 10 with style feedback
- 🎨 **Color Coded Match** — green/amber/red match percentage badges
- ⚡ **44,000 Products** — real fashion catalog with AI-powered embeddings
- 🐳 **100% Local** — runs entirely in Docker, zero cloud cost

---

## 🏗️ Architecture

```
User uploads photo / types description
        ↓
Next.js Frontend (port 3000)
        ↓ POST /search or /search-by-text
FastAPI Backend (port 8000)
        ↓
YOLO v8 ──────── detects & crops objects
        ↓
CLIP ViT-B/32 ── converts image/text to 512-dim vector
        ↓
Weaviate ──────── finds nearest neighbor products (HNSW)
        ↓
Style Engine ──── gender-aware complements + smart swaps
        ↓
Outfit Score ──── rates outfit out of 10
        ↓
Results displayed in UI
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Inline styles (no CSS framework dependency) |
| Backend | FastAPI, Python 3.11 |
| Object Detection | YOLOv8 nano (Ultralytics) |
| Image Embedding | CLIP ViT-B/32 (OpenCLIP) |
| Text Embedding | CLIP ViT-B/32 (multimodal) |
| Vector Database | Weaviate 1.25 |
| Cache | Redis 7 |
| Dataset | Kaggle Fashion Product Images (44k) |
| Container | Docker + Docker Compose |
| Storage | Browser localStorage (cart, wishlist, history) |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/search` | Visual search by image upload |
| POST | `/search-by-url` | Visual search by image URL |
| POST | `/search-by-text` | Search by text description (CLIP multimodal) |
| GET | `/styleboard/{id}` | Get gender-aware complements + smart swaps |
| POST | `/outfit-score` | Score an outfit out of 10 |
| POST | `/catalog/ingest` | Ingest product catalog |
| DELETE | `/catalog/clear` | Clear catalog |

API docs: `http://localhost:8000/docs`

---

## 🧠 How It Works

### Visual Search Pipeline
1. **YOLO** detects and crops individual objects from the uploaded photo
2. **CLIP** converts each cropped image into a 512-dimensional vector
3. **Weaviate** finds nearest neighbor vectors using HNSW algorithm
4. Results ranked by cosine similarity score

### Text Search Pipeline
1. User types a description (e.g. "brown leather belt")
2. **CLIP** converts text into a 512-dimensional vector
3. **Weaviate** finds products whose image vectors are closest to the text vector
4. Returns visually matching products — no keywords needed

### Smart Swap Scoring
```
score = (price_saving × 0.4) + (rating/5.0 × 0.4) + (promo_active × 0.2)
```

### Gender-Aware Complements
- Detects gender from product name (women/men/girl/boy)
- Filters both complements and swaps to match gender
- Falls back to unfiltered results if no gender-specific items found

### Outfit Score (out of 10)
- **Color Harmony** (0-3pts) — checks color compatibility between items
- **Occasion Match** (0-3pts) — formal, smart casual, casual, ethnic, sporty
- **Category Coverage** (0-2pts) — variety of item types
- **Price Consistency** (0-2pts) — similar price range across items

### Wishlist & Cart
- Both stored in browser localStorage — persist across sessions
- Cart supports quantity control and order total calculation
- Free shipping threshold at $100

---

## 📁 Project Structure

```
Runtime-Terror-CS04/
├── README.md
├── docker-compose.yml
├── visual-discovery-backend/     ← FastAPI + ML
│   ├── app/
│   │   ├── main.py               ← API routes
│   │   ├── services/
│   │   │   ├── clip_service.py   ← Image/text embedding
│   │   │   ├── yolo_service.py   ← Object detection
│   │   │   ├── weaviate_service.py ← Vector search
│   │   │   └── style_service.py  ← Swaps, complements, outfit score
│   │   └── models/schemas.py     ← Data models
│   ├── kaggle_ingest.py          ← Dataset ingestion
│   ├── Dockerfile
│   └── requirements.txt
└── visual-discovery-frontend/    ← Next.js UI
    ├── src/app/
    │   ├── page.tsx              ← App shell
    │   ├── components/
    │   │   ├── UploadScreen.tsx  ← Photo/text/URL upload
    │   │   ├── ResultsScreen.tsx ← Search results + sort/filter
    │   │   ├── StyleBoardScreen.tsx ← Outfit builder + score
    │   │   ├── WishlistScreen.tsx ← Saved items
    │   │   ├── CartScreen.tsx    ← Shopping cart
    │   │   └── shared.tsx        ← UI components
    │   └── globals.css
    └── src/lib/
        ├── mockData.ts           ← API calls
        └── wishlist.ts           ← Cart, wishlist, history

```

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Python 3.11
- Node.js 20 LTS

### 1. Clone the repo
```bash
git clone https://github.com/InnovaSolutions-AiHackathon/runtime-terror-cs04.git
cd runtime-terror-cs04
```

### 2. Start backend services
```bash
docker compose up -d
```

### 3. Start frontend
```bash
cd visual-discovery-frontend
npm install
npm run dev
```

### 4. Ingest the catalog (first time only)
```bash
# Download Kaggle dataset first
pip install kaggle
kaggle datasets download -d paramaggarwal/fashion-product-images-small

cd visual-discovery-backend
python kaggle_ingest.py --zip "/path/to/fashion-product-images-small.zip"
```

### 5. Open the app
```
http://localhost:3000
```

---

## 📊 Performance

| Metric | Value |
|---|---|
| Catalog size | 44,000 products |
| Search latency (CPU) | ~2-4 seconds |
| Search latency (GPU) | ~300ms |
| CLIP embedding dim | 512 |
| Match accuracy | 85-90% category correct |

---

## 🔮 Future Enhancements

1. **FashionSigLIP** — upgrade to fashion-specific embedding model for 20% better accuracy
2. **Live Camera Search** — point camera at any product for instant search
3. **GNN Recommendations** — graph neural network trained on real purchase data
4. **Virtual Try-On** — AR overlay using ControlNet
5. **Multimodal Search** — combine image + text ("find this but in blue")
6. **Production Deploy** — Vercel (frontend) + AWS GPU instance (backend) + Weaviate Cloud

---

## 👥 Team

**Runtime Terror**

Built with ⚡ at Hackathon 2026

---

## 📄 License

MIT License — free to use and modify.