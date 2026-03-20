"use client";
import { useState } from "react";
import { MOCK_PRODUCTS, SearchResult } from "@/lib/mockData";
import { StarRating, Badge, BackButton, Logo } from "./shared";
import Footer from "./Footer";

type Product = typeof MOCK_PRODUCTS[0];

function ProductCard({ p, selected, onSelect }: { p: Product; selected: boolean; onSelect: (p: Product) => void }) {
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
        <span style={{ position: "absolute", top: 6, right: 6, background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>
          {p.match_score}%
        </span>
        {p.promo && (
          <span style={{ position: "absolute", top: 6, left: 6, background: "#059669", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>
            SALE
          </span>
        )}
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{p.brand}</p>
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
  searchResult,
  onComplete,
  onBack,
}: {
  searchResult: SearchResult | null;
  onComplete: (p: Product) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [filter,   setFilter]   = useState("All");

  // Use real results if available, else fall back to mock
  const products  = searchResult?.products ?? MOCK_PRODUCTS;
  const detected  = searchResult?.detected_objects.map(o => o.label) ?? ["Trousers", "Shoes", "Bag"];
  const confidence = searchResult?.confidence ?? 94;

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered   = filter === "All" ? products : products.filter(p => p.category === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
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

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
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

        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>{filtered.length} products found</p>

        {/* Grid */}
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
            <p style={{ fontSize: 12, color: "#9ca3af" }}>{selected.brand} · ${selected.price}</p>
          </div>
          <button onClick={() => onComplete(selected)} style={{
            padding: "10px 20px", background: "#7c3aed", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            Complete the Look →
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
}