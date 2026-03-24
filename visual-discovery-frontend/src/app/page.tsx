"use client";
import { useState, useEffect } from "react";
import UploadScreen     from "./components/UploadScreen";
import ResultsScreen    from "./components/ResultsScreen";
import StyleBoardScreen from "./components/StyleBoardScreen";
import WishlistScreen   from "./components/WishlistScreen";
import CartScreen       from "./components/CartScreen";
import { MOCK_PRODUCTS, SearchResult } from "@/lib/mockData";
import { getWishlist, getCartCount } from "@/lib/wishlist";

type Screen  = "upload" | "results" | "styleboard" | "wishlist" | "cart";
type Product = typeof MOCK_PRODUCTS[0];

export default function Home() {
  const [screen,        setScreen]        = useState<Screen>("upload");
  const [anchor,        setAnchor]        = useState<Product | null>(null);
  const [searchResult,  setSearchResult]  = useState<SearchResult | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount,     setCartCount]     = useState(0);
  const [prevScreen,    setPrevScreen]    = useState<Screen>("upload");

  useEffect(() => {
    localStorage.removeItem("vd_wishlist");
    localStorage.removeItem("vd_cart");
    localStorage.removeItem("vd_search_history");
    setWishlistCount(getWishlist().length);
    setCartCount(getCartCount());
  }, [screen]);

  const goTo = (s: Screen) => {
    setPrevScreen(screen);
    setScreen(s);
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative" }}>

      {/* Floating action buttons */}
      {screen !== "wishlist" && screen !== "cart" && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 100, display: "flex", gap: 8 }}>
          {/* Wishlist */}
          <button onClick={() => goTo("wishlist")} style={{
            background: "#e11d48", color: "#fff", border: "none",
            borderRadius: 99, padding: "8px 12px", fontSize: 13,
            fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 4,
            boxShadow: "0 2px 8px rgba(225,29,72,0.3)",
          }}>
            ♥ {wishlistCount > 0 && (
              <span style={{ background: "#fff", color: "#e11d48", borderRadius: 99, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button onClick={() => goTo("cart")} style={{
            background: "#7c3aed", color: "#fff", border: "none",
            borderRadius: 99, padding: "8px 12px", fontSize: 13,
            fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 4,
            boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
          }}>
            🛒 {cartCount > 0 && (
              <span style={{ background: "#fff", color: "#7c3aed", borderRadius: 99, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      )}

      {screen === "upload" && (
        <UploadScreen onSearch={result => { setSearchResult(result || null); goTo("results"); }} />
      )}
      {screen === "results" && (
        <ResultsScreen
          key="results"
          searchResult={searchResult}
          onComplete={p => { setAnchor(p); goTo("styleboard"); }}
          onBack={() => goTo("upload")}
        />
      )}
      {screen === "styleboard" && (
        <StyleBoardScreen anchor={anchor} onBack={() => goTo("results")} />
      )}
      {screen === "wishlist" && (
        <WishlistScreen onBack={() => goTo(prevScreen)} />
      )}
      {screen === "cart" && (
        <CartScreen onBack={() => goTo(prevScreen)} />
      )}
    </main>
  );
}