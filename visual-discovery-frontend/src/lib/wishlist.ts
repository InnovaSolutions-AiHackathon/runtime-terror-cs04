// Wishlist stored in localStorage
const KEY = "vd_wishlist";

export type WishlistItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  image_url: string;
  category: string;
  match_score: number;
  promo: boolean;
  addedAt: string;
};

export const getWishlist = (): WishlistItem[] => {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToWishlist = (item: WishlistItem): void => {
  const list = getWishlist();
  if (!list.find(i => i.id === item.id)) {
    list.unshift({ ...item, addedAt: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(list));
  }
};

export const removeFromWishlist = (id: string): void => {
  const list = getWishlist().filter(i => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
};

export const isInWishlist = (id: string): boolean => {
  return getWishlist().some(i => i.id === id);
};

export const clearWishlist = (): void => {
  localStorage.removeItem(KEY);
};

// ── Search History ─────────────────────────────────────────
const HISTORY_KEY = "vd_search_history";

export type SearchHistoryItem = {
  id: string;
  type: "text" | "image" | "url";
  query: string;        // text query or image filename or url
  preview?: string;     // base64 preview for image searches
  timestamp: string;
};

export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const addToHistory = (item: Omit<SearchHistoryItem, "id" | "timestamp">) => {
  const list = getSearchHistory();
  const newItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  // Keep only last 5, avoid duplicates
  const filtered = list.filter(i => i.query !== item.query);
  filtered.unshift(newItem);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 5)));
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};