"""
Kaggle Fashion Dataset Ingestion Script
---------------------------------------
1. Extracts the ZIP
2. Reads styles.csv
3. Runs CLIP on every product image
4. Ingests into Weaviate

Usage:
    python ingest_kaggle.py --zip "C:/Users/.../fashion-product-images-small.zip"
"""

import argparse
import zipfile
import os
import csv
import time
import sys
import random
from pathlib import Path
from PIL import Image
import io

# Realistic price ranges per category
PRICE_RANGES = {
    "Topwear":    (19.99, 89.99),
    "Bottomwear": (24.99, 99.99),
    "Footwear":   (29.99, 199.99),
    "Accessories":(9.99,  149.99),
    "Bags":       (19.99, 299.99),
    "Watches":    (49.99, 499.99),
    "Innerwear":  (9.99,  39.99),
    "Outerwear":  (49.99, 299.99),
    "Shoes":      (29.99, 199.99),
}

# ── Args ───────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--zip", required=True, help="Path to downloaded Kaggle ZIP file")
parser.add_argument("--limit", type=int, default=None, help="Limit number of products (for testing)")
parser.add_argument("--batch", type=int, default=100, help="Batch size for ingestion")
args = parser.parse_args()

ZIP_PATH    = Path(args.zip)
EXTRACT_DIR = ZIP_PATH.parent / "fashion-dataset"

# ── Step 1: Extract ZIP ────────────────────────────────────
if not EXTRACT_DIR.exists():
    print(f"📦 Extracting {ZIP_PATH.name}...")
    with zipfile.ZipFile(ZIP_PATH, "r") as z:
        z.extractall(EXTRACT_DIR)
    print(f"✅ Extracted to {EXTRACT_DIR}")
else:
    print(f"✅ Already extracted at {EXTRACT_DIR}")

# ── Step 2: Load styles.csv ────────────────────────────────
CSV_PATH = EXTRACT_DIR / "styles.csv"
if not CSV_PATH.exists():
    # try nested folder
    candidates = list(EXTRACT_DIR.rglob("styles.csv"))
    if not candidates:
        print("❌ styles.csv not found. Check your ZIP structure.")
        sys.exit(1)
    CSV_PATH = candidates[0]

IMAGES_DIR = CSV_PATH.parent / "images"
if not IMAGES_DIR.exists():
    candidates = list(EXTRACT_DIR.rglob("images"))
    IMAGES_DIR = candidates[0] if candidates else EXTRACT_DIR / "images"

print(f"📋 Reading catalog from {CSV_PATH}")
print(f"🖼  Images directory: {IMAGES_DIR}")

products = []
with open(CSV_PATH, encoding="utf-8", errors="ignore") as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            img_path = IMAGES_DIR / f"{row['id']}.jpg"
            if not img_path.exists():
                continue  # skip if image missing
            category = row.get("masterCategory", "Other")
            low, high = PRICE_RANGES.get(category, (9.99, 99.99))
            price = round(random.uniform(low, high), 2)
            rating = round(random.uniform(3.5, 5.0), 1)
            reviews = random.randint(10, 5000)
            products.append({
                "id":        str(row["id"]),
                "name":      row.get("productDisplayName", "Unknown Product"),
                "brand":     row.get("brandName", "Unknown"),
                "price":     price,
                "rating":    rating,
                "reviews":   reviews,
                "category":  category,
                "sub_category": row.get("subCategory", ""),
                "color":     row.get("baseColour", ""),
                "gender":    row.get("gender", ""),
                "season":    row.get("season", ""),
                "image_path": str(img_path),
                "image_url": f"http://localhost:8000/images/{row['id']}.jpg",
                "promo":     False,
            })
        except Exception as e:
            continue

if args.limit:
    products = products[:args.limit]

print(f"✅ Found {len(products)} products with images")

# ── Step 3: Load CLIP + Weaviate ───────────────────────────
print("\n🧠 Loading CLIP model (first time may download weights ~350MB)...")
sys.path.insert(0, str(Path(__file__).parent))

from app.services.clip_service     import get_clip_service
from app.services.weaviate_service import get_weaviate_service

clip     = get_clip_service()
weaviate = get_weaviate_service()

# ── Step 4: Clear old catalog ──────────────────────────────
print("🗑  Clearing old catalog...")
try:
    weaviate.client.collections.delete("Product")
    weaviate._ensure_collection()
    print("✅ Catalog cleared")
except Exception as e:
    print(f"   (clear skipped: {e})")

# ── Step 5: Ingest in batches ──────────────────────────────
print(f"\n🚀 Ingesting {len(products)} products in batches of {args.batch}...")
print("   This will take a while — CLIP processes each image.\n")

success = 0
failed  = 0
start   = time.time()

for i, product in enumerate(products):
    try:
        # Load and embed image
        img = Image.open(product["image_path"]).convert("RGB")

        # Resize to speed up embedding (CLIP works well at 224x224)
        img.thumbnail((512, 512), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        embedding = clip.embed_image(buf.getvalue())

        # Ingest into Weaviate
        weaviate.ingest_product(product, embedding)
        success += 1

        # Progress update every 100 products
        if (i + 1) % 100 == 0:
            elapsed  = time.time() - start
            rate     = (i + 1) / elapsed
            remaining = (len(products) - i - 1) / rate
            print(f"   [{i+1}/{len(products)}] ✅ {success} ingested · "
                  f"{rate:.1f} products/sec · "
                  f"~{int(remaining//60)}m {int(remaining%60)}s remaining")

    except Exception as e:
        failed += 1
        if failed <= 5:
            print(f"   ⚠️  Failed {product['id']}: {e}")

total_time = time.time() - start
print(f"\n✅ Ingestion complete!")
print(f"   Ingested : {success} products")
print(f"   Failed   : {failed} products")
print(f"   Time     : {int(total_time//60)}m {int(total_time%60)}s")
print(f"\n🌐 Test your search at http://localhost:8000/docs")