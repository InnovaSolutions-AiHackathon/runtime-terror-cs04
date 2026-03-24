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

    # ── Outfit Score ───────────────────────────────────────────
# Add this to the bottom of style_service.py

OCCASION_MAP = {
    "formal":      ["shirt", "trouser", "blazer", "belt", "watch", "shoes"],
    "smart_casual":["shirt", "jeans", "chino", "belt", "sneaker", "watch"],
    "casual":      ["tshirt", "jeans", "sneaker", "bag", "cap"],
    "ethnic":      ["kurta", "salwar", "saree", "dupatta", "sandal", "jewellery"],
    "sporty":      ["track", "sport", "sneaker", "cap", "shorts"],
}

COLOR_HARMONY = {
    "black":  ["white", "grey", "red", "blue", "beige"],
    "white":  ["black", "navy", "blue", "grey", "beige"],
    "blue":   ["white", "grey", "beige", "brown"],
    "brown":  ["beige", "white", "olive", "cream", "tan"],
    "grey":   ["white", "black", "blue", "maroon"],
    "beige":  ["brown", "white", "olive", "tan"],
    "red":    ["black", "white", "navy"],
    "green":  ["white", "beige", "brown"],
    "navy":   ["white", "beige", "grey", "red"],
    "maroon": ["grey", "white", "beige"],
}

def detect_color(name: str) -> str:
    name_lower = name.lower()
    colors = ["black", "white", "blue", "brown", "grey", "gray", "beige",
              "red", "green", "navy", "maroon", "yellow", "pink", "orange",
              "purple", "tan", "cream", "olive"]
    for c in colors:
        if c in name_lower:
            return c
    return ""

def detect_occasion(name: str, category: str) -> str:
    name_lower = (name + " " + category).lower()
    for occasion, keywords in OCCASION_MAP.items():
        if any(k in name_lower for k in keywords):
            return occasion
    return "casual"

def score_outfit(anchor: dict, complements: list) -> dict:
    """
    Score an outfit out of 10.
    - Anchor alone starts at a reasonable base score
    - Each complement added always increases the score
    - Max score 10.0
    """
    feedback = []
    all_items = [anchor] + complements

    # ── Base score — anchor alone gets 6.0 ────────────────
    base_score = 6.0

    # ── Occasion detection ─────────────────────────────────
    occasions = [detect_occasion(item.get("name", ""), item.get("category", "")) for item in all_items]
    occasion_counts = {}
    for o in occasions:
        occasion_counts[o] = occasion_counts.get(o, 0) + 1
    dominant_occasion = max(occasion_counts, key=occasion_counts.get)

    occasion_labels = {
        "formal":       "Formal",
        "smart_casual": "Smart Casual",
        "casual":       "Casual",
        "ethnic":       "Ethnic / Traditional",
        "sporty":       "Sporty / Active",
    }
    feedback.append(f"✅ Occasion: {occasion_labels.get(dominant_occasion, 'Casual')}")

    # ── Complement bonus — each item adds +0.5 ────────────
    complement_bonus = 0.0
    if len(complements) == 0:
        feedback.append("💡 Add complementary items to improve your score")
    else:
        complement_bonus = min(len(complements) * 0.5, 2.5)
        feedback.append(f"✅ {len(complements)} complementary item{'s' if len(complements) > 1 else ''} added")

    # ── Color harmony bonus — extra +0.5 if colors match ──
    color_bonus = 0.0
    colors = [detect_color(item.get("name", "")) for item in all_items]
    colors = [c for c in colors if c]
    if len(colors) >= 2:
        harmony_count = sum(
            1 for i in range(len(colors))
            for j in range(i + 1, len(colors))
            if colors[j] in COLOR_HARMONY.get(colors[i], []) or colors[i] == colors[j]
        )
        pairs = len(colors) * (len(colors) - 1) / 2
        ratio = harmony_count / pairs if pairs > 0 else 0
        if ratio >= 0.5:
            color_bonus = 0.5
            feedback.append("✅ Colors complement each other beautifully")
        else:
            feedback.append("💡 Consider more harmonious color combinations")

    # ── Complete outfit bonus — +0.5 for 3+ items ─────────
    complete_bonus = 0.0
    if len(all_items) >= 3:
        complete_bonus = 0.5
        feedback.append("✅ Complete outfit — great styling!")
    elif len(all_items) == 2:
        feedback.append("💡 Add one more item for a complete look")

    # ── Final score ────────────────────────────────────────
    total = min(round(base_score + complement_bonus + color_bonus + complete_bonus, 1), 10.0)
    grade = "Excellent" if total >= 8.5 else "Great" if total >= 7.5 else "Good" if total >= 6.5 else "Fair"

    return {
        "total":    total,
        "out_of":   10,
        "feedback": feedback,
        "occasion": occasion_labels.get(dominant_occasion, "Casual"),
        "grade":    grade,
    }