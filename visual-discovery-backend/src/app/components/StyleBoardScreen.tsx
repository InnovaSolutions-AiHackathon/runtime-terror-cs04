"use client";
import { useState, useEffect } from "react";
import { MOCK_COMPLEMENTS, MOCK_SWAPS, MOCK_PRODUCTS, getStyleBoard, StyleBoardResult  } from "@/lib/mockData";
import { Badge, BackButton } from "./shared";

type Product = typeof MOCK_PRODUCTS[0];

// Product image component — shows real image or fallback emoji
function ProductImage({ url, size = 50 }: { url?: string; size?: number }) {
  const [error, setError] = useState(false);
  if (url && !error) {
    return (
      <img
        src={url}
        alt="product"
        onError={() => setError(true)}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, background: "#f3f4f6", borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, flexShrink: 0
    }}>
      🛍️
    </div>
  );
}

export default function StyleBoardScreen({ anchor, onBack }: { anchor: Product | null; onBack: () => void }) {
  const [tab,           setTab]           = useState<"complements" | "swaps">("complements");
  const [swaps, setSwaps] = useState<StyleBoardResult["swaps"]>(MOCK_SWAPS as any);
  const [complements, setComplements] = useState<StyleBoardResult["complements"]>(MOCK_COMPLEMENTS as any);
  const [loading,       setLoading]       = useState(false);
  const [selectedComp,  setSelectedComp]  = useState<string | null>(null);
  const [anchorItem,    setAnchorItem]    = useState(anchor ?? MOCK_PRODUCTS[0]);

  const item = anchorItem;

  // Fetch real style board when anchor changes
 useEffect(() => {
  if (!anchorItem?.id) return;
  setLoading(true);
  setSelectedComp(null);
  getStyleBoard(anchorItem.id)
    .then(data => {
      if (data.complements?.length) setComplements(data.complements);
      if (data.swaps?.length)       setSwaps(data.swaps);
    })
    .catch(err => console.error("Style board fetch failed:", err))
    .finally(() => setLoading(false));
}, [anchorItem?.id]); // ← this must be anchorItem?.id not anchor?.id

  const handleSwapClick = (swap: typeof swaps[0]) => {
    // Replace anchor with the swap product
    setAnchorItem({
      id:          swap.id,
      name:        swap.name,
      brand:       swap.brand,
      price:       swap.price,
      rating:      swap.rating,
      reviews:     0,
      category:    anchorItem.category,
      image_url:   swap.image_url,
      match_score: 100,
      promo:       false,
    });
    setTab("complements");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
        <BackButton onClick={onBack} />
        <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</div>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Style Board</span>
        {loading && <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>Loading...</span>}
      </header>

      <main style={{ flex: 1, padding: 20 }}>
        {/* Anchor product */}
        <div style={{ background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1.5px solid #c4b5fd", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", gap: 14, alignItems: "center" }}>
          <ProductImage url={item.image_url} size={64} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Your anchor item</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 2 }}>{item.name}</p>
            <p style={{ fontSize: 13, color: "#6d28d9" }}>{item.brand} · ${item.price} · {item.match_score}% match</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {([{ k: "complements", l: "🧩 Complete the Look" }, { k: "swaps", l: "🔄 Smart Swaps" }] as const).map(({ k, l }) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              background: tab === k ? "#fff" : "transparent",
              color: tab === k ? "#111827" : "#6b7280",
              boxShadow: tab === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {tab === "complements" ? (
          <>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
              Items that work well with your anchor piece — curated by style affinity.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {complements.map((p, i) => (
                <div key={p.id ?? i}
                  onClick={() => setSelectedComp(p.id ?? String(i))}
                  style={{
                    background: selectedComp === (p.id ?? String(i)) ? "#f5f3ff" : "#f9fafb",
                    border: `1.5px solid ${selectedComp === (p.id ?? String(i)) ? "#7c3aed" : "#f3f4f6"}`,
                    borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                  <ProductImage url={p.image_url} size={50} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{p.brand}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{p.reason}</p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", flexShrink: 0 }}>${p.price}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Style note</p>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                This combination creates a smart-casual look built around your selected piece. Items are curated based on style affinity and complementary categories.
              </p>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
              Same visual DNA — but with better pricing, higher ratings, or active promotions.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {swaps.map((p, i) => (
                <div key={p.id ?? i}
                  onClick={() => handleSwapClick(p)}
                  style={{
                    background: "#f9fafb", border: "1px solid #f3f4f6",
                    borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.border = "1.5px solid #7c3aed")}
                  onMouseLeave={e => (e.currentTarget.style.border = "1px solid #f3f4f6")}
                >
                  <ProductImage url={p.image_url} size={50} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{p.brand}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{p.reason}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>${p.price}</p>
                    <Badge color="green">{p.badge}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#166534", marginBottom: 4 }}>💡 Swap logic</p>
              <p style={{ fontSize: 12, color: "#15803d", lineHeight: 1.6 }}>
                Swaps are scored on visual similarity · price delta · star rating · active promotions. Higher score = better value for the same look.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}