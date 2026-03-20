"use client";
import { useState, useEffect } from "react";
import UploadScreen     from "./components/UploadScreen";
import ResultsScreen    from "./components/ResultsScreen";
import StyleBoardScreen from "./components/StyleBoardScreen";
import WishlistScreen   from "./components/WishlistScreen";
import { MOCK_PRODUCTS, SearchResult } from "@/lib/mockData";
import { getWishlist } from "@/lib/wishlist";

type Screen  = "upload" | "results" | "styleboard" | "wishlist";
type Product = typeof MOCK_PRODUCTS[0];

export default function Home() {
  const [screen,        setScreen]        = useState<Screen>("upload");
  const [anchor,        setAnchor]        = useState<Product | null>(null);
  const [searchResult,  setSearchResult]  = useState<SearchResult | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [prevScreen,    setPrevScreen]    = useState<Screen>("upload");

  useEffect(() => {
    setWishlistCount(getWishlist().length);
  }, [screen]);

  const goTo = (s: Screen) => {
    setPrevScreen(screen);
    setScreen(s);
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
      {/* Wishlist floating button — visible on all screens except wishlist */}
      {screen !== "wishlist" && (
        <button
          onClick={() => goTo("wishlist")}
          style={{
            position: "fixed", top: 16, right: 16, zIndex: 100,
            background: "#e11d48", color: "#fff", border: "none",
            borderRadius: 99, padding: "8px 14px", fontSize: 13,
            fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6,
            boxShadow: "0 2px 8px rgba(225,29,72,0.3)",
          }}
        >
          ♥ {wishlistCount > 0 && <span style={{ background: "#fff", color: "#e11d48", borderRadius: 99, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{wishlistCount}</span>}
        </button>
      )}

      {screen === "upload" && (
        <UploadScreen onSearch={result => { setSearchResult(result || null); goTo("results"); }} />
      )}
      {screen === "results" && (
        <ResultsScreen
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
    </main>
  );
}