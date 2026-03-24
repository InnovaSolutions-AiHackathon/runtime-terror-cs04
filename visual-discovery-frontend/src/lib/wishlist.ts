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
  } catch { return []; }
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

// ── Cart ───────────────────────────────────────────────────
const CART_KEY = "vd_cart";

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image_url: string;
  category: string;
  quantity: number;
};

export const getCart = (): CartItem[] => {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const addToCart = (item: Omit<CartItem, "quantity">): void => {
  const list    = getCart();
  const existing = list.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    list.unshift({ ...item, quantity: 1 });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(list));
};

export const removeFromCart = (id: string): void => {
  const list = getCart().filter(i => i.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(list));
};

export const updateCartQuantity = (id: string, quantity: number): void => {
  if (quantity <= 0) { removeFromCart(id); return; }
  const list = getCart().map(i => i.id === id ? { ...i, quantity } : i);
  localStorage.setItem(CART_KEY, JSON.stringify(list));
};

export const isInCart = (id: string): boolean => {
  return getCart().some(i => i.id === id);
};

export const getCartTotal = (): number => {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
};

export const getCartCount = (): number => {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
};

export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
};

// ── Search History ─────────────────────────────────────────
const HISTORY_KEY = "vd_search_history";

export type SearchHistoryItem = {
  id: string;
  type: "text" | "image" | "url";
  query: string;
  preview?: string;
  timestamp: string;
};

export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const addToHistory = (item: Omit<SearchHistoryItem, "id" | "timestamp">) => {
  const list    = getSearchHistory();
  const newItem = { ...item, id: Date.now().toString(), timestamp: new Date().toISOString() };
  const filtered = list.filter(i => i.query !== item.query);
  filtered.unshift(newItem);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 5)));
};

export const clearHistory = (): void => {
  localStorage.removeItem(HISTORY_KEY);
};