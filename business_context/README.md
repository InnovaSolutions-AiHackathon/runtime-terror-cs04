# Business Context — Visual Discovery
**Team:** Runtime Terror  
**Problem Statement:** CS04 — Visual Product Discovery  
**Hackathon:** InnovaSolutions AI Hackathon 2026

---

## Problem Statement

Traditional ecommerce search is fundamentally broken for visual discovery. Users are forced to describe products in words — but fashion is visual. This creates a **vocabulary gap**:

- A user sees a red patent leather handbag on Instagram but searches "red purse" and gets irrelevant results
- A user spots a style on the street but cannot name the garment type, color, or brand
- A user wants to replicate a complete outfit but only knows one item to start from
- Keyword search fails entirely for attributes like texture, silhouette, pattern, and material

**The result:** Lost sales, frustrated users, and a search experience that hasn't evolved in 20 years.

---

## Our Solution

**Visual Discovery** transforms the retail journey from keyword-based search to visual and semantic discovery across three pillars:

### Pillar 1 — Precision Visual Search (Find It)
Users upload any photo — a screenshot, Instagram post, street style image, or camera capture — and the system identifies every product in the image and returns the most visually similar items from the catalog. Users can also describe what they want in natural language ("brown leather belt", "floral cotton kurta") and get visually matching results.

### Pillar 2 — Style Synthesis (Complete It)
Once a user finds an anchor product, the system builds a complete outfit around it by suggesting gender-aware complementary items from compatible style categories. A smart scoring system rates the outfit out of 10 based on color harmony, occasion match, category coverage and price consistency — updating in real time as the user builds their look.

### Pillar 3 — Smart Value Discovery (Swap It)
The system finds better-value alternatives with the same visual DNA — products with similar appearance but better pricing, higher ratings, or active promotions. Swaps are gender-filtered and subcategory-matched so a women's boot only gets swapped with other women's boots, not unrelated accessories.

---

## Target Users

| User | Pain Point | How We Solve It |
|---|---|---|
| Fashion-forward shoppers | Can't describe what they see | Upload photo → instant visual search |
| Busy professionals | No time to browse | Complete outfit suggested automatically |
| Budget-conscious buyers | Want same style for less | Smart Swaps find better-priced alternatives |
| Style explorers | Don't know where to start | Text search with natural language |
| Impulse buyers | See something, want it now | Camera/URL search finds it instantly |

---

## Business Value

### Revenue Impact
- **Higher conversion rate** — users find exactly what they want instead of settling for keyword approximations
- **Higher average order value** — Style Board encourages buying complete outfits (3-5 items) instead of single products
- **Reduced search abandonment** — visual search succeeds where keywords fail

### Cost Impact
- **Lower return rate** — users make informed decisions seeing the complete look before purchasing
- **Reduced customer support** — fewer "I can't find it" queries
- **Zero cloud cost** — entire system runs locally on Docker, no API fees

### Competitive Differentiation
- Goes beyond finding one product to curating a complete lifestyle
- Gender-aware recommendations prevent irrelevant suggestions
- Real-time outfit scoring guides users toward better style decisions
- Text + image + URL search covers all discovery entry points

---

## Expanded Business Context

### Original Use Case (CS04)
The base use case focused on visual product search — allowing users to upload images and find similar products in a catalog.

### Our Expansions
Through development we identified and implemented several expansions beyond the base use case:

**1. Multi-modal Search**
Added text-based semantic search using CLIP's multimodal capabilities — users can describe products in natural language and get visually matching results without any image upload. This addresses the case where users can partially describe what they want but lack an exact image.

**2. Style Synthesis Engine**
Moved beyond single-product matching to outfit curation. When a user finds a product they like, the system automatically suggests complementary items to build a complete look — addressing the "what goes with this?" problem that follows every fashion purchase decision.

**3. Smart Swaps**
Added value-based alternative discovery — finding products with the same visual DNA but better price, rating or promotional status. This addresses the common scenario where users love a style but want a better deal.

**4. Gender-Aware Recommendations**
Added automatic gender detection from product names to ensure complement and swap suggestions are relevant — a women's handbag gets women's shoes as complements, not men's formal wear.

**5. Outfit Intelligence**
Added a real-time outfit scoring system that evaluates color harmony, occasion match, category variety and price consistency — giving users actionable feedback as they build their look.

**6. Complete Shopping Journey**
Extended from search-only to a full shopping flow — wishlist, add to cart (individual items or entire outfit), quantity management, order summary with free shipping threshold.

---

## Technical Approach

### Why Visual Embeddings?
Traditional search uses text metadata — product names, descriptions, tags. This fails for fashion because:
- Products are often poorly tagged
- Visual attributes (texture, silhouette, color tone) cannot be captured in text
- User intent is visual — they saw something, they want something like it

CLIP (Contrastive Language-Image Pretraining) solves this by encoding both images and text into the same 512-dimensional vector space — trained on 400 million image-text pairs. This enables:
- Image → image similarity search
- Text → image similarity search
- Cross-modal understanding ("floral summer dress" finds floral dresses even without that exact text in product metadata)

### Why Weaviate?
A relational database cannot efficiently find nearest neighbors in 512-dimensional space. Weaviate uses HNSW (Hierarchical Navigable Small World) — a graph-based approximate nearest neighbor algorithm — that finds the most similar vectors in milliseconds regardless of catalog size.

### Production Readiness
The architecture is designed for scale:
- Swap CLIP ViT-B/32 for Marqo-FashionSigLIP (fashion-specific, 20% better accuracy) with one line change
- Replace local Weaviate with Weaviate Cloud for distributed search
- Add GPU inference for sub-300ms latency
- Add Kafka pipeline for real-time catalog ingestion
- Deploy frontend to Vercel, backend to AWS EC2 with GPU

---

## Catalog

- **Source:** Kaggle Fashion Product Images Dataset
- **Size:** 44,000 fashion products
- **Categories:** Apparel, Footwear, Accessories, Watches, Bags, Jewellery and more
- **Coverage:** Men, Women, Boys, Girls, Unisex
- **Attributes:** Product name, category, subcategory, color, season, occasion, gender

---

## Key Metrics

| Metric | Value |
|---|---|
| Catalog size | 44,000 products |
| Search latency (CPU) | 2-4 seconds |
| Search latency (GPU) | ~300ms |
| Embedding dimensions | 512 |
| Search accuracy (category) | 85-90% |
| Docker services | 4 (UI, Backend, Weaviate, Redis) |
| Lines of code | ~3,000 |

---

## User Journey

```
User sees a product they love (Instagram, street, magazine)
            ↓
Opens Visual Discovery
            ↓
Uploads photo OR pastes URL OR types description
            ↓
AI identifies products → returns 6 best visual matches
            ↓
User filters by price/rating, sorts by match/price/rating
            ↓
Selects a product → taps "Complete the Look"
            ↓
Style Board shows:
  - Outfit Score (out of 10, updates in real time)
  - Gender-aware complementary items
  - Smart Swap alternatives with savings
            ↓
User builds outfit → adds individual items or entire outfit to cart
            ↓
Checkout with order summary and free shipping threshold
```

---

## Team

**Runtime Terror**  
InnovaSolutions AI Hackathon 2025  
Problem Statement: CS04 — Visual Product Discovery

> "See it. Find it. Style it."