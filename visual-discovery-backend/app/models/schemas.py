from pydantic import BaseModel
from typing import List, Optional

class DetectedObject(BaseModel):
    label: str
    confidence: float
    bbox: List[float]

class Product(BaseModel):
    id: str
    name: str
    brand: str
    price: float
    rating: float
    reviews: int
    category: str
    image_url: str
    match_score: float
    promo: bool = False

class SwapProduct(BaseModel):
    id: str
    name: str
    brand: str
    price: float
    rating: float
    image_url: str
    reason: str
    badge: str

class ComplementProduct(BaseModel):
    id: str
    name: str
    brand: str
    price: float
    image_url: str
    reason: str

class SearchResponse(BaseModel):
    detected_objects: List[DetectedObject]
    products: List[Product]
    confidence: float

class StyleBoardResponse(BaseModel):
    anchor: Product
    complements: List[ComplementProduct]
    swaps: List[SwapProduct]

class IngestRequest(BaseModel):
    products: List[dict]

class IngestResponse(BaseModel):
    ingested: int
    message: str
