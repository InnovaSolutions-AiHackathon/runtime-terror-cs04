import weaviate
import weaviate.classes as wvc
from typing import List, Optional
import os

COLLECTION_NAME = "Product"

class WeaviateService:
    def __init__(self, url: str = "http://localhost:8080"):
        print(f"Connecting to Weaviate at {url}...")
        host = os.getenv("WEAVIATE_HOST", "weaviate")
        port = int(os.getenv("WEAVIATE_PORT", "8080"))
        self.client = weaviate.connect_to_local(
            host=host, port=port
        )
        self._ensure_collection()
        print("Weaviate connected.")

    def _ensure_collection(self):
        """Create Product collection if it doesn't exist."""
        if not self.client.collections.exists(COLLECTION_NAME):
            self.client.collections.create(
                name=COLLECTION_NAME,
                vectorizer_config=wvc.config.Configure.Vectorizer.none(),
                properties=[
                    wvc.config.Property(name="product_id",  data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="name",        data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="brand",       data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="price",       data_type=wvc.config.DataType.NUMBER),
                    wvc.config.Property(name="rating",      data_type=wvc.config.DataType.NUMBER),
                    wvc.config.Property(name="reviews",     data_type=wvc.config.DataType.INT),
                    wvc.config.Property(name="category",    data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="image_url",   data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="promo",       data_type=wvc.config.DataType.BOOL),
                    wvc.config.Property(name="gender",      data_type=wvc.config.DataType.TEXT),  # NEW
                ],
            )
            print(f"Created Weaviate collection: {COLLECTION_NAME}")

    def ingest_product(self, product: dict, embedding: List[float]):
        """Insert a single product with its embedding."""
        collection = self.client.collections.get(COLLECTION_NAME)
        collection.data.insert(
            properties={
                "product_id": product["id"],
                "name":       product["name"],
                "brand":      product["brand"],
                "price":      float(product["price"]),
                "rating":     float(product["rating"]),
                "reviews":    int(product["reviews"]),
                "category":   product["category"],
                "image_url":  product.get("image_url", ""),
                "promo":      bool(product.get("promo", False)),
                "gender":     product.get("gender", "Unisex"),  # NEW
            },
            vector=embedding,
        )

    def search(self, embedding: List[float], limit: int = 6, gender: Optional[str] = None) -> List[dict]:
        """Find most visually similar products by vector, optionally filtered by gender."""
        collection = self.client.collections.get(COLLECTION_NAME)

        # Build gender filter
        filters = None
        if gender and gender.lower() not in ("unisex", ""):
            filters = (
                wvc.query.Filter.by_property("gender").equal(gender) |
                wvc.query.Filter.by_property("gender").equal("Unisex")
            )

        results = collection.query.near_vector(
            near_vector=embedding,
            limit=limit,
            filters=filters,
            return_metadata=wvc.query.MetadataQuery(certainty=True),
        )
        products = []
        for obj in results.objects:
            p = obj.properties
            p["match_score"] = round((obj.metadata.certainty or 0) * 100, 1)
            p["id"] = p.pop("product_id", str(obj.uuid))
            products.append(p)
        return products

    def get_by_category(self, category: str, limit: int = 10, offset: int = 0, gender: Optional[str] = None) -> List[dict]:
        import random
        collection = self.client.collections.get(COLLECTION_NAME)

        # Base filter — category match
        cat_filter = wvc.query.Filter.by_property("category").equal(category)

        # Always exclude kids
        exclude_kids = (
            wvc.query.Filter.by_property("gender").not_equal("Boys") &
            wvc.query.Filter.by_property("gender").not_equal("Girls")
        )

        if gender and gender.lower() not in ("unisex", ""):
            gender_filter = (
                wvc.query.Filter.by_property("gender").equal(gender) |
                wvc.query.Filter.by_property("gender").equal("Unisex")
            )
            filters = cat_filter & gender_filter & exclude_kids
        else:
            filters = cat_filter & exclude_kids

        random_offset = random.randint(0, 50)
        results = collection.query.fetch_objects(
            filters=filters,
            limit=limit,
            offset=random_offset,
        )
        if not results.objects:
            results = collection.query.fetch_objects(
                filters=filters,
                limit=limit,
            )
        return [obj.properties for obj in results.objects]

    def close(self):
        self.client.close()

# Singleton
_weaviate_service = None

def get_weaviate_service() -> WeaviateService:
    global _weaviate_service
    if _weaviate_service is None:
        _weaviate_service = WeaviateService(
            url=os.getenv("WEAVIATE_URL", "http://localhost:8080")
        )
    return _weaviate_service