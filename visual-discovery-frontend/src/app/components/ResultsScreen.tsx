"use client";
import { useState, useEffect, useMemo } from "react";
import { MOCK_PRODUCTS, SearchResult } from "@/lib/mockData";
import { StarRating, Badge, BackButton, Logo } from "./shared";
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist";
import { extractBrand } from "./shared";

type Product = typeof MOCK_PRODUCTS[0];
type SortOption = "match" | "price_asc" | "price_desc" | "rating";

function ProductCard({ p, selected, onSelect }: { p: Product; selected: boolean; onSelect: (p: Product) => void }) {
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(isInWishlist(p.id));
  }, [p.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(p.id);
    } else {
      addToWishlist({
        id: p.id, name: p.name, brand: extractBrand(p.name) || p.category,
        price: p.price, rating: p.rating,
        image_url: p.image_url, category: p.category,
        match_score: p.match_score, promo: p.promo,
        addedAt: new Date().toISOString(),
      });
    }
    setWishlisted(!wishlisted);
  };

  // Match score color coding
  const matchColor = p.match_score >= 90 ? "#059669" : p.match_score >= 70 ? "#d97706" : "#dc2626";

  return (
    <div onClick={() => onSelect(p)} style={{
      background: "#f9fafb", borderRadius: 12, padding: 12, cursor: "pointer",
      border: `2px solid ${selected ? "#7c3aed" : "transparent"}`,
      boxShadow: selected ? "0 0 0 3px #ede9fe" : "0 1px 3px rgba(0,0,0,0.06)",
      transition: "all 0.15s",
    }}>
      <div style={{ background: "#fff", borderRadius: 8, height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 10, position: "relative" }}>
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} style={{ maxHeight: 90, maxWidth: "100%", objectFit: "contain", borderRadius: 6 }} />
        ) : (
          <span>🛍️</span>
        )}
        {/* Match score — color coded */}
        <span style={{ position: "absolute", top: 6, right: 6, background: matchColor, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>
          {p.match_score}%
        </span>
        {p.promo && (
          <span style={{ position: "absolute", top: 6, left: 6, background: "#059669", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>
            SALE
          </span>
        )}
        {/* Wishlist heart */}
        <button onClick={toggleWishlist} style={{
          position: "absolute", bottom: 6, right: 6,
          width: 26, height: 26, borderRadius: "50%",
          border: "none", cursor: "pointer",
          background: wishlisted ? "#e11d48" : "rgba(255,255,255,0.9)",
          color: wishlisted ? "#fff" : "#e11d48",
          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}>♥</button>
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{extractBrand(p.name) || p.category}</p>
      <p style={{ fontSize: 13, fontWeight: 500, color: "#1f2937", marginBottom: 6, lineHeight: 1.3 }}>{p.name}</p>
      <StarRating rating={p.rating} />
      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, marginTop: 2 }}>{p.reviews.toLocaleString()} reviews</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>${p.price}</span>
        <Badge color="blue">{p.category}</Badge>
      </div>
    </div>
  );
}

export default function ResultsScreen({
  searchResult, onComplete, onBack,
}: {
  searchResult: SearchResult | null;
  onComplete: (p: Product) => void;
  onBack: () => void;
}) {
  const [selected,   setSelected]   = useState<Product | null>(null);
  const [filter,     setFilter]     = useState("All");
  const [sort,       setSort]       = useState<SortOption>("match");
  const [maxPrice,   setMaxPrice]   = useState<number>(500);
  const [minRating,  setMinRating]  = useState<number>(0);
  const [showFilter, setShowFilter] = useState(false);

  const products   = searchResult?.products ?? MOCK_PRODUCTS;
  const detected   = searchResult?.detected_objects.map(o => o.label) ?? ["Trousers", "Shoes", "Bag"];
  const confidence = searchResult?.confidence ?? 94;

  const actualMaxPrice = useMemo(() =>
    Math.ceil(Math.max(...products.map(p => p.price))),
  [products]);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const catMatch    = filter === "All" || p.category === filter;
      const priceMatch  = p.price <= maxPrice;
      const ratingMatch = p.rating >= minRating;
      return catMatch && priceMatch && ratingMatch;
    });
    result = [...result].sort((a, b) => {
      if (sort === "match")      return b.match_score - a.match_score;
      if (sort === "price_asc")  return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "rating")     return b.rating - a.rating;
      return 0;
    });
    return result;
  }, [products, filter, sort, maxPrice, minRating]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
        <BackButton onClick={onBack} />
        <Logo size="sm" />
        {searchResult && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#059669", fontWeight: 500, background: "#f0fdf4", padding: "2px 8px", borderRadius: 99 }}>
            ✓ Live results
          </span>
        )}
      </header>

      <main style={{ flex: 1, padding: 20, paddingBottom: 100 }}>
        {/* Detected objects */}
        <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280" }}>Objects detected:</span>
          {detected.filter((o, i, arr) => arr.indexOf(o) === i).map((o, i) => <Badge key={`${o}-${i}`} color="purple">{o}</Badge>)}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>Confidence: {confidence}%</span>
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: "6px 16px", borderRadius: 99, border: "1.5px solid",
              fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              borderColor: filter === c ? "#7c3aed" : "#e5e7eb",
              background: filter === c ? "#7c3aed" : "#fff",
              color: filter === c ? "#fff" : "#6b7280",
            }}>{c}</button>
          ))}
        </div>

        {/* Sort + Filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <select value={sort} onChange={e => setSort(e.target.value as SortOption)} style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: "1.5px solid #e5e7eb", fontSize: 12,
            background: "#fff", color: "#374151", cursor: "pointer",
          }}>
            <option value="match">Sort: Best Match</option>
            <option value="price_asc">Sort: Price Low → High</option>
            <option value="price_desc">Sort: Price High → Low</option>
            <option value="rating">Sort: Top Rated</option>
          </select>
          <button onClick={() => setShowFilter(!showFilter)} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: `1.5px solid ${showFilter ? "#7c3aed" : "#e5e7eb"}`,
            background: showFilter ? "#f5f3ff" : "#fff",
            color: showFilter ? "#7c3aed" : "#6b7280", cursor: "pointer",
          }}>🎛 Filter</button>
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {/* Price range */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Max Price</span>
                <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>${maxPrice}</span>
              </div>
              <input type="range" min={0} max={actualMaxPrice} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#7c3aed" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>$0</span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>${actualMaxPrice}</span>
              </div>
            </div>

            {/* Min rating */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 8 }}>Min Rating</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <button key={r} onClick={() => setMinRating(r)} style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                    border: "1.5px solid",
                    borderColor: minRating === r ? "#7c3aed" : "#e5e7eb",
                    background: minRating === r ? "#7c3aed" : "#fff",
                    color: minRating === r ? "#fff" : "#6b7280", cursor: "pointer",
                  }}>{r === 0 ? "All" : `${r}★+`}</button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => { setMaxPrice(actualMaxPrice); setMinRating(0); setFilter("All"); }}
              style={{ marginTop: 12, fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Results count */}
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
          {filtered.length} products found
          {filtered.length !== products.length && ` (filtered from ${products.length})`}
        </p>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#374151", marginBottom: 6 }}>No products match your filters</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Try adjusting price range or rating filter</p>
          </div>
        )}

        {/* Product grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {filtered.map(p => (
            <ProductCard key={p.id} p={p} selected={selected?.id === p.id} onSelect={setSelected} />
          ))}
        </div>
      </main>

      {/* Sticky CTA */}
      {selected && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #f3f4f6", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24 }}>🛍️</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{selected.name}</p>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>{extractBrand(selected.name) || selected.category} · ${selected.price}</p>
          </div>
          <button onClick={() => onComplete(selected)} style={{
            padding: "10px 20px", background: "#7c3aed", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            Complete the Look →
          </button>
        </div>
      )}
    </div>
  );
}