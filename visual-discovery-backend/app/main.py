from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from app.services.clip_service     import get_clip_service
from app.services.yolo_service     import get_yolo_service
from app.services.weaviate_service import get_weaviate_service
from app.services.style_service    import (
    COMPLEMENT_MAP, score_swap, get_swap_reason,
    get_swap_badge, get_complement_reason, get_specific_category
)
from app.models.schemas import (
    SearchResponse, StyleBoardResponse, IngestRequest, IngestResponse,
    DetectedObject, Product, SwapProduct, ComplementProduct
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading ML models...")
    get_clip_service()
    get_yolo_service()
    get_weaviate_service()
    print("All models ready.")
    yield
    get_weaviate_service().close()

app = FastAPI(
    title="Visual Discovery API",
    description="Visual product search using YOLO + CLIP + Weaviate",
    version="1.0.0",
    lifespan=lifespan,
)

# Serve local product images
images_dir = os.environ.get(
    "IMAGES_DIR",
    r"C:\Users\hemalatha.d\Desktop\Dataset\fashion-dataset\images"
)
if os.path.exists(images_dir):
    app.mount("/images", StaticFiles(directory=images_dir), name="images")
    print(f"Serving images from: {images_dir}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

# ── POST /search ──────────────────────────────────────────
@app.post("/search", response_model=SearchResponse)
async def search(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    yolo        = get_yolo_service()
    clip        = get_clip_service()
    weaviate    = get_weaviate_service()
    crops       = yolo.detect_and_crop(image_bytes)

    detected_objects = [
        DetectedObject(label=label, confidence=conf, bbox=bbox)
        for label, conf, _, bbox in crops
    ]

    import io
    _, _, primary_crop, _ = crops[0]
    buf = io.BytesIO()
    primary_crop.save(buf, format="JPEG")
    embedding    = clip.embed_image(buf.getvalue())
    raw_products = weaviate.search(embedding, limit=6)

    products = [
        Product(
            id=str(p.get("id", p.get("product_id", ""))),
            name=p.get("name", ""),
            brand=p.get("brand", ""),
            price=float(p.get("price", 0)),
            rating=float(p.get("rating", 0)),
            reviews=int(p.get("reviews", 0)),
            category=p.get("category", ""),
            image_url=p.get("image_url", ""),
            match_score=float(p.get("match_score", 0)),
            promo=bool(p.get("promo", False)),
        )
        for p in raw_products
    ]

    return SearchResponse(
        detected_objects=detected_objects,
        products=products,
        confidence=round(crops[0][1] * 100, 1),
    )

# ── POST /search-by-url ───────────────────────────────────
@app.post("/search-by-url")
async def search_by_url(payload: dict):
    import httpx
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL required")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10, follow_redirects=True)
            if not resp.headers.get("content-type", "").startswith("image/"):
                raise HTTPException(status_code=400, detail="URL is not an image")
            image_bytes = resp.content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch image: {str(e)}")

    yolo     = get_yolo_service()
    clip     = get_clip_service()
    weaviate = get_weaviate_service()
    crops    = yolo.detect_and_crop(image_bytes)

    detected_objects = [
        DetectedObject(label=label, confidence=conf, bbox=bbox)
        for label, conf, _, bbox in crops
    ]

    import io
    _, _, primary_crop, _ = crops[0]
    buf = io.BytesIO()
    primary_crop.save(buf, format="JPEG")
    embedding    = clip.embed_image(buf.getvalue())
    raw_products = weaviate.search(embedding, limit=6)

    products = [
        Product(
            id=str(p.get("id", p.get("product_id", ""))),
            name=p.get("name", ""),
            brand=p.get("brand", ""),
            price=float(p.get("price", 0)),
            rating=float(p.get("rating", 0)),
            reviews=int(p.get("reviews", 0)),
            category=p.get("category", ""),
            image_url=p.get("image_url", ""),
            match_score=float(p.get("match_score", 0)),
            promo=bool(p.get("promo", False)),
        )
        for p in raw_products
    ]

    return SearchResponse(
        detected_objects=detected_objects,
        products=products,
        confidence=round(crops[0][1] * 100, 1),
    )

# ── POST /search-by-text ──────────────────────────────────
@app.post("/search-by-text")
async def search_by_text(payload: dict):
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query text required")

    clip         = get_clip_service()
    weaviate     = get_weaviate_service()
    embedding    = clip.embed_text(query)
    raw_products = weaviate.search(embedding, limit=6)

    products = [
        Product(
            id=str(p.get("id", p.get("product_id", ""))),
            name=p.get("name", ""),
            brand=p.get("brand", ""),
            price=float(p.get("price", 0)),
            rating=float(p.get("rating", 0)),
            reviews=int(p.get("reviews", 0)),
            category=p.get("category", ""),
            image_url=p.get("image_url", ""),
            match_score=float(p.get("match_score", 0)),
            promo=bool(p.get("promo", False)),
        )
        for p in raw_products
    ]

    return SearchResponse(
        detected_objects=[DetectedObject(label=query, confidence=1.0, bbox=[0,0,0,0])],
        products=products,
        confidence=100.0,
    )

# ── GET /styleboard/{product_id} ──────────────────────────
@app.get("/styleboard/{product_id}")
async def styleboard(product_id: str):
    try:
        wv         = get_weaviate_service()
        collection = wv.client.collections.get("Product")
        import weaviate.classes as wvc

        # Fetch anchor
        results = collection.query.fetch_objects(
            filters=wvc.query.Filter.by_property("product_id").equal(product_id),
            limit=1,
        )
        if not results.objects:
            raise HTTPException(status_code=404, detail="Product not found")

        anchor_raw = results.objects[0].properties
        anchor = Product(
            id=str(anchor_raw.get("product_id", product_id)),
            name=anchor_raw.get("name", ""),
            brand=anchor_raw.get("brand", ""),
            price=float(anchor_raw.get("price", 0)),
            rating=float(anchor_raw.get("rating", 0)),
            reviews=int(anchor_raw.get("reviews", 0)),
            category=anchor_raw.get("category", ""),
            image_url=anchor_raw.get("image_url", ""),
            match_score=100.0,
            promo=bool(anchor_raw.get("promo", False)),
        )

        # Detect gender from anchor name
        anchor_name_lower = anchor_raw.get("name", "").lower()
        if any(w in anchor_name_lower for w in ["women", "girl", "female", "ladies"]):
            gender = "women"
        elif any(w in anchor_name_lower for w in ["men", "boy", "male", "gents"]):
            gender = "men"
        else:
            gender = None

        # Fetch complements filtered by gender
        anchor_category       = anchor_raw.get("category", "")
        complement_categories = COMPLEMENT_MAP.get(anchor_category, ["Accessories", "Footwear"])
        complements = []

        for cat in complement_categories[:2]:
            items = wv.get_by_category(cat, limit=50)
            # Filter by gender
            if gender:
                gender_items = [p for p in items if gender in p.get("name", "").lower()]
                items = gender_items if gender_items else items  # fallback if no gender match
            items = items[:2]
            for item in items:
                complements.append(ComplementProduct(
                    id=str(item.get("product_id", "")),
                    name=item.get("name", ""),
                    brand=item.get("brand", ""),
                    price=float(item.get("price", 0)),
                    image_url=item.get("image_url", ""),
                    reason=get_complement_reason(item, anchor_raw),
                ))

        # Fetch swaps — same specific subcategory + gender filter
        anchor_specific = get_specific_category(anchor_raw)
        same_cat_items  = wv.get_by_category(anchor_category, limit=100)
        swap_candidates = [
            p for p in same_cat_items
            if str(p.get("product_id", "")) != product_id
            and get_specific_category(p) == anchor_specific
            and (not gender or gender in p.get("name", "").lower())
        ]
        # Fallback 1 — same subcategory, ignore gender
        if not swap_candidates:
            swap_candidates = [
                p for p in same_cat_items
                if str(p.get("product_id", "")) != product_id
                and get_specific_category(p) == anchor_specific
            ]
        # Fallback 2 — same category, ignore subcategory and gender
        if not swap_candidates:
            swap_candidates = [
                p for p in same_cat_items
                if str(p.get("product_id", "")) != product_id
            ]
        swap_candidates.sort(key=lambda p: score_swap(p, anchor_raw), reverse=True)

        swaps = [
            SwapProduct(
                id=str(p.get("product_id", "")),
                name=p.get("name", ""),
                brand=p.get("brand", ""),
                price=float(p.get("price", 0)),
                rating=float(p.get("rating", 0)),
                image_url=p.get("image_url", ""),
                reason=get_swap_reason(p, anchor_raw),
                badge=get_swap_badge(p, anchor_raw),
            )
            for p in swap_candidates[:3]
        ]

        return StyleBoardResponse(anchor=anchor, complements=complements, swaps=swaps)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# ── POST /outfit-score ────────────────────────────────────
@app.post("/outfit-score")
async def outfit_score(payload: dict):
    from app.services.style_service import score_outfit
    anchor      = payload.get("anchor", {})
    complements = payload.get("complements", [])
    score       = score_outfit(anchor, complements)
    return score

# ── POST /catalog/ingest ──────────────────────────────────
@app.post("/catalog/ingest", response_model=IngestResponse)
async def ingest_catalog(request: IngestRequest):
    clip     = get_clip_service()
    weaviate = get_weaviate_service()
    count    = 0

    for product in request.products:
        try:
            image_url = product.get("image_url", "")
            if image_url:
                import httpx
                async with httpx.AsyncClient() as client:
                    resp      = await client.get(image_url, timeout=10)
                    embedding = clip.embed_image(resp.content)
            else:
                text      = f"{product['name']} {product.get('category', '')}"
                embedding = clip.embed_text(text)

            weaviate.ingest_product(product, embedding)
            count += 1
        except Exception as e:
            print(f"Failed to ingest product {product.get('id')}: {e}")

    return IngestResponse(ingested=count, message=f"Successfully ingested {count} products")

# ── DELETE /catalog/clear ─────────────────────────────────
@app.delete("/catalog/clear")
def clear_catalog():
    wv = get_weaviate_service()
    wv.client.collections.delete("Product")
    wv._ensure_collection()
    return {"message": "Catalog cleared"}