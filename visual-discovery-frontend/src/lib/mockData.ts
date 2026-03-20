const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────
export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  image_url: string;
  match_score: number;
  promo: boolean;
};

export type DetectedObject = {
  label: string;
  confidence: number;
  bbox: number[];
};

export type SearchResult = {
  detected_objects: DetectedObject[];
  products: Product[];
  confidence: number;
};

export type StyleBoardResult = {
  anchor: Product;
  complements: {
    id: string;
    name: string;
    brand: string;
    price: number;
    image_url: string;
    reason: string;
  }[];
  swaps: {
    id: string;
    name: string;
    brand: string;
    price: number;
    rating: number;
    image_url: string;
    reason: string;
    badge: string;
  }[];
};

// ── API calls ──────────────────────────────────────────────

export const searchByImage = async (file: File): Promise<SearchResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/search`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Search failed: ${err}`);
  }

  return res.json();
};

// To this:
export const getStyleBoard = async (productId: string): Promise<StyleBoardResult> => {
  const res = await fetch(`${API_URL}/styleboard/${productId}`);
  if (!res.ok) throw new Error("Style board failed");
  return res.json();
};

export const searchByUrl = async (url: string): Promise<SearchResult> => {
  const res = await fetch(`${API_URL}/search-by-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("URL search failed");
  return res.json();
};

// ── Keep mock data for fallback / offline dev ──────────────
export const MOCK_PRODUCTS = [
  { id:"p001", name:"Slim Fit Chino Trousers", brand:"Uniqlo", price:49.99, rating:4.5, reviews:1280, category:"Bottoms", image_url:"", match_score:97, promo:false },
  { id:"p002", name:"Leather Chelsea Boots", brand:"Thursday Boot Co.", price:199.99, rating:4.8, reviews:890, category:"Footwear", image_url:"", match_score:93, promo:true },
  { id:"p003", name:"Merino Crew Neck Sweater", brand:"Everlane", price:98.00, rating:4.6, reviews:543, category:"Tops", image_url:"", match_score:89, promo:false },
  { id:"p004", name:"Canvas Tote Bag", brand:"Baggu", price:38.00, rating:4.4, reviews:2100, category:"Accessories", image_url:"", match_score:85, promo:true },
  { id:"p005", name:"Slim Tapered Jeans", brand:"Levi's", price:79.99, rating:4.3, reviews:3400, category:"Bottoms", image_url:"", match_score:82, promo:false },
  { id:"p006", name:"Minimalist Watch", brand:"Skagen", price:145.00, rating:4.7, reviews:670, category:"Accessories", image_url:"", match_score:78, promo:false },
];

export const MOCK_SWAPS = [
  { id:"p007", name:"Slim Chino — Budget Pick", brand:"H&M", price:29.99, rating:4.1, reviews:890, image_url:"", reason:"Same silhouette · $20 cheaper", badge:"Save $20" },
  { id:"p008", name:"Premium Chino Trousers", brand:"Banana Republic", price:89.99, rating:4.7, reviews:420, image_url:"", reason:"Higher rating · better fabric", badge:"Top Rated" },
];

export const MOCK_COMPLEMENTS = [
  { id:"p009", name:"Oxford Button-Down Shirt", brand:"Ralph Lauren", price:89.00, image_url:"", reason:"Pairs with slim chinos" },
  { id:"p010", name:"Leather Belt — Brown", brand:"Fossil", price:45.00, image_url:"", reason:"Matches chelsea boot tone" },
  { id:"p011", name:"Cotton Pocket Square", brand:"Drake's", price:25.00, image_url:"", reason:"Completes the smart-casual look" },
];

export const DETECTED_OBJECTS = ["Trousers", "Shoes", "Bag"];