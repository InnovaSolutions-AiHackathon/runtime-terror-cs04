from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
from collections import Counter
import os
from dotenv import load_dotenv

load_dotenv()

from app.services.clip_service     import get_clip_service
from app.services.yolo_service     import get_yolo_service
from app.services.weaviate_service import get_weaviate_service
from app.services.style_service    import (
    COMPLEMENT_MAP, score_swap, get_swap_reason, get_swap_badge, get_complement_reason
)
from app.models.schemas import (
    SearchResponse, StyleBoardResponse, IngestRequest, IngestResponse,
    DetectedObject, Product, SwapProduct, ComplementProduct
)


def detect_gender_from_results(results: list) -> Optional[str]:
    """Detect gender by majority vote from top search results."""
    genders = [
        r.get("gender", "")
        for r in results
        if r.get("gender", "").lower() not in ("unisex", "", "none")
    ]
    if not genders:
        # All results are Unisex/neutral — belts, specs, watches etc.
        print("Gender detection: neutral/unisex item, no filter applied")
        return None

    total = len(results)
    majority_gender, majority_count = Counter(genders).most_common(1)[0]

    # Only apply filter if majority is strong (>50% of results)
    if majority_count / total < 0.5:
        print("Gender detection: mixed results, no filter applied")
        return None

    print(f"Detected gender from results: {majority_gender} ({majority_count}/{total})")
    return majority_gender


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
images_dir = os.environ.get("IMAGES_DIR", "/app/images")
if os.path.exists(images_dir):
    app.mount("/images", StaticFiles(directory=images_dir), name="images")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

# ── POST /search ──────────────────────────────────────────
@app.post("/search", response_model=SearchResponse)
async def search(
    file: UploadFile = File(...),
    gender: Optional[str] = Query(default=None, description="Override gender filter. Auto-detected if not provided.")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()

    yolo     = get_yolo_service()
    clip     = get_clip_service()
    weaviate = get_weaviate_service()

    crops = yolo.detect_and_crop(image_bytes)

    detected_objects = [
        DetectedObject(label=label, confidence=conf, bbox=bbox)
        for label, conf, _, bbox in crops
    ]

    _, _, primary_crop, _ = crops[0]

    import io
    buf = io.BytesIO()
    primary_crop.save(buf, format="JPEG")
    embedding = clip.embed_image(buf.getvalue())

    if gender:
        effective_gender = gender
    else:
        # Search without filter first to detect gender from top results
        initial_results = weaviate.search(embedding, limit=3, gender=None)
        effective_gender = detect_gender_from_results(initial_results)

    print(f"Using gender filter: {effective_gender}")

    # Final search with gender filter
    raw_products = weaviate.search(embedding, limit=6, gender=effective_gender)

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

# ── GET /styleboard/{product_id} ──────────────────────────
@app.get("/styleboard/{product_id}")
async def styleboard(
    product_id: str,
    gender: Optional[str] = Query(default=None)
):
    try:
        wv = get_weaviate_service()
        collection = wv.client.collections.get("Product")
        import weaviate.classes as wvc

        results = collection.query.fetch_objects(
            filters=wvc.query.Filter.by_property("product_id").equal(product_id),
            limit=1,
        )
        if not results.objects:
            raise HTTPException(status_code=404, detail="Product not found")

        anchor_raw = results.objects[0].properties
        effective_gender = gender or anchor_raw.get("gender")

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

        anchor_category = anchor_raw.get("category", "")
        complement_categories = COMPLEMENT_MAP.get(anchor_category, ["Accessories", "Tops"])
        complements = []

        for cat in complement_categories[:2]:
            items = wv.get_by_category(cat, limit=2, gender=effective_gender)
            for item in items:
                complements.append(ComplementProduct(
                    id=str(item.get("product_id", "")),
                    name=item.get("name", ""),
                    brand=item.get("brand", ""),
                    price=float(item.get("price", 0)),
                    image_url=item.get("image_url", ""),
                    reason=get_complement_reason(item, anchor_raw),
                ))

        from app.services.style_service import get_specific_category
        anchor_specific = get_specific_category(anchor_raw)
        same_cat_items = wv.get_by_category(anchor_category, limit=50, gender=effective_gender)
        swap_candidates = [
            p for p in same_cat_items
            if str(p.get("product_id", "")) != product_id
            and get_specific_category(p) == anchor_specific
        ]
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

        return StyleBoardResponse(
            anchor=anchor,
            complements=complements,
            swaps=swaps,
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


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
                    resp = await client.get(image_url, timeout=10)
                    embedding = clip.embed_image(resp.content)
            else:
                text = f"{product['name']} {product.get('category', '')}"
                embedding = clip.embed_text(text)

            weaviate.ingest_product(product, embedding)
            count += 1
        except Exception as e:
            print(f"Failed to ingest product {product.get('id')}: {e}")

    return IngestResponse(ingested=count, message=f"Successfully ingested {count} products")

@app.delete("/catalog/clear")
def clear_catalog():
    weaviate = get_weaviate_service()
    weaviate.client.collections.delete("Product")
    weaviate._ensure_collection()
    return {"message": "Catalog cleared"}


# ── POST /search-by-url ───────────────────────────────────
@app.post("/search-by-url")
async def search_by_url(
    payload: dict,
    gender: Optional[str] = Query(default=None)
):
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
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch image: {str(e)}")

    yolo     = get_yolo_service()
    clip     = get_clip_service()
    weaviate = get_weaviate_service()

    crops = yolo.detect_and_crop(image_bytes)
    detected_objects = [
        DetectedObject(label=label, confidence=conf, bbox=bbox)
        for label, conf, _, bbox in crops
    ]

    import io
    _, _, primary_crop, _ = crops[0]
    buf = io.BytesIO()
    primary_crop.save(buf, format="JPEG")
    embedding = clip.embed_image(buf.getvalue())

    if gender:
        effective_gender = gender
    else:
        initial_results = weaviate.search(embedding, limit=3, gender=None)
        effective_gender = detect_gender_from_results(initial_results)

    print(f"Using gender filter: {effective_gender}")
    raw_products = weaviate.search(embedding, limit=6, gender=effective_gender)

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
async def search_by_text(
    payload: dict,
    gender: Optional[str] = Query(default=None)
):
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query text required")

    clip     = get_clip_service()
    weaviate = get_weaviate_service()

    embedding = clip.embed_text(query)

    if gender:
        effective_gender = gender
    else:
        initial_results = weaviate.search(embedding, limit=3, gender=None)
        effective_gender = detect_gender_from_results(initial_results)

    print(f"Using gender filter: {effective_gender}")
    raw_products = weaviate.search(embedding, limit=6, gender=effective_gender)

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