from typing import List

# Style affinity rules — which categories complement each other
COMPLEMENT_MAP = {
    # Original categories
    "Bottoms":     ["Tops", "Footwear", "Accessories"],
    "Tops":        ["Bottoms", "Accessories", "Footwear"],
    "Footwear":    ["Bottoms", "Accessories", "Tops"],
    "Accessories": ["Footwear", "Tops", "Bottomwear"],
    "Outerwear":   ["Tops", "Bottoms", "Footwear"],
    # Kaggle dataset categories
    "Apparel":     ["Footwear", "Accessories", "Sporting Goods"],
    "Topwear":     ["Bottomwear", "Footwear", "Accessories"],
    "Bottomwear":  ["Topwear", "Footwear", "Accessories"],
    "Innerwear":   ["Topwear", "Bottomwear"],
    "Bags":        ["Footwear", "Accessories", "Apparel"],
    "Shoes":       ["Bottomwear", "Accessories", "Apparel"],
    "Watches":     ["Apparel", "Bags", "Accessories"],
    "Sunglasses":  ["Apparel", "Bags", "Footwear"],
    "Belts":       ["Bottomwear", "Topwear", "Footwear"],
    "Wallets":     ["Bags", "Accessories", "Apparel"],
    "Jewellery":   ["Apparel", "Bags", "Footwear"],
    "Flip Flops":  ["Bottomwear", "Apparel", "Accessories"],
    "Sandals":     ["Bottomwear", "Apparel", "Accessories"],
    "Sporting Goods": ["Apparel", "Footwear", "Accessories"],
    "Personal Care":  ["Apparel", "Accessories"],
    "Home Furnishing": ["Home Furnishing", "Accessories"],
}

def score_swap(candidate: dict, anchor: dict) -> float:
    """
    Score a swap candidate vs the anchor product.
    Higher = better swap. Weights:
      - Price savings  40%
      - Rating         40%
      - Promo active   20%
    """
    anchor_price = anchor.get("price") or 1.0  # avoid division by zero
    price_score  = max(0, (anchor_price - candidate.get("price", 0)) / anchor_price) * 0.4
    rating_score = (candidate["rating"] / 5.0) * 0.4
    promo_score  = 0.2 if candidate.get("promo") else 0.0
    return round(price_score + rating_score + promo_score, 3)

def get_swap_reason(candidate: dict, anchor: dict) -> str:
    reasons = []
    if candidate["price"] < anchor["price"]:
        saving = round(anchor["price"] - candidate["price"], 2)
        reasons.append(f"${saving} cheaper")
    if candidate["rating"] > anchor["rating"]:
        reasons.append("higher rating")
    if candidate.get("promo"):
        reasons.append("active promotion")
    return " · ".join(reasons) if reasons else "Similar style"

def get_swap_badge(candidate: dict, anchor: dict) -> str:
    if candidate["price"] < anchor["price"]:
        saving = round(anchor["price"] - candidate["price"], 2)
        return f"Save ${saving}"
    if candidate["rating"] >= 4.7:
        return "Top Rated"
    if candidate.get("promo"):
        return "On Sale"
    return "Similar Style"

def get_complement_reason(complement: dict, anchor: dict) -> str:
    return f"Pairs well with {anchor.get('category', 'your item').lower()}"

def get_specific_category(product: dict) -> str:
    """Extract specific category from product name."""
    name = product.get("name", "").lower()
    if any(w in name for w in ["belt", "belts"]):
        return "belt"
    if any(w in name for w in ["bag", "handbag", "tote", "clutch", "sling"]):
        return "bag"
    if any(w in name for w in ["watch", "watches"]):
        return "watch"
    if any(w in name for w in ["scarf", "scarves"]):
        return "scarf"
    if any(w in name for w in ["wallet", "wallets"]):
        return "wallet"
    if any(w in name for w in ["shoe", "shoes", "boot", "boots", "sandal", "sandals", "sneaker", "sneakers"]):
        return "shoes"
    if any(w in name for w in ["shirt", "shirts", "tshirt", "t-shirt"]):
        return "shirt"
    if any(w in name for w in ["jeans", "trouser", "trousers", "pant", "pants", "chino"]):
        return "bottomwear"
    if any(w in name for w in ["jacket", "coat", "blazer"]):
        return "outerwear"
    return product.get("category", "Accessories").lower()