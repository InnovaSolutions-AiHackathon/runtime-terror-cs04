"use client";
import { useState, useEffect } from "react";
import { MOCK_COMPLEMENTS, MOCK_SWAPS, MOCK_PRODUCTS, getStyleBoard, StyleBoardResult } from "@/lib/mockData";
import { Badge, BackButton } from "./shared";
import { addToCart, isInCart, getCartCount } from "@/lib/wishlist";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Product = typeof MOCK_PRODUCTS[0];

// ── Product Image ─────────────────────────────────────────
function ProductImage({ url, size = 50 }: { url?: string; size?: number }) {
  const [error, setError] = useState(false);
  if (url && !error) {
    return (
      <img src={url} alt="product" onError={() => setError(true)}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, background: "#f3f4f6", borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, flexShrink: 0,
    }}>🛍️</div>
  );
}

// ── Outfit Score Card ─────────────────────────────────────
function OutfitScoreCard({ score }: { score: any }) {
  const color = score.total >= 8 ? "#059669" : score.total >= 6 ? "#d97706" : "#dc2626";
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e9d5ff", borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", marginBottom: 2 }}>✨ Outfit Score</p>
          <p style={{ fontSize: 11, color: "#9ca3af" }}>{score.occasion} · {score.grade}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 28, fontWeight: 800, color }}>{score.total}</span>
          <span style={{ fontSize: 14, color: "#9ca3af" }}>/10</span>
        </div>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99, width: `${score.total * 10}%`,
          background: color, transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {score.feedback.map((f: string, i: number) => (
          <p key={i} style={{ fontSize: 12, color: "#4b5563", margin: 0 }}>{f}</p>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function StyleBoardScreen({ anchor, onBack }: { anchor: Product | null; onBack: () => void }) {
  const [tab,          setTab]          = useState<"complements" | "swaps">("complements");
  const [complements,  setComplements]  = useState<StyleBoardResult["complements"]>(MOCK_COMPLEMENTS as any);
  const [swaps,        setSwaps]        = useState<StyleBoardResult["swaps"]>(MOCK_SWAPS as any);
  const [loading,      setLoading]      = useState(false);
  const [anchorItem,   setAnchorItem]   = useState(anchor ?? MOCK_PRODUCTS[0]);
  const [outfitScore,  setOutfitScore]  = useState<any>(null);
  const [outfitItems,  setOutfitItems]  = useState<any[]>([]);
  const [cartCount,    setCartCount]    = useState(0);
  const [anchorInCart, setAnchorInCart] = useState(false);
  const [addedAll,     setAddedAll]     = useState(false);

  const item = anchorItem;

  // Sync cart state
  useEffect(() => {
    setAnchorInCart(isInCart(anchorItem.id));
    setCartCount(getCartCount());
  }, [anchorItem.id]);

  // Fetch outfit score
  const fetchOutfitScore = async (anchor: any, complements: any[]) => {
    try {
      const res = await fetch(`${API_URL}/outfit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anchor, complements }),
      });
      const data = await res.json();
      setOutfitScore(data);
    } catch (err) {
      console.error("Outfit score failed:", err);
    }
  };

  // Fetch style board when anchor changes
  useEffect(() => {
    if (!anchorItem?.id) return;
    setLoading(true);
    setOutfitItems([]);
    setAddedAll(false);
    getStyleBoard(anchorItem.id)
      .then(async data => {
        if (data.complements?.length) setComplements(data.complements);
        if (data.swaps?.length)       setSwaps(data.swaps);
        await fetchOutfitScore(anchorItem, []);
      })
      .catch(err => console.error("Style board fetch failed:", err))
      .finally(() => setLoading(false));
  }, [anchorItem?.id]);

  // Toggle complement in/out of outfit
  const toggleOutfitItem = async (comp: any) => {
    const isAdded  = outfitItems.find(i => i.id === comp.id);
    const newItems = isAdded
      ? outfitItems.filter(i => i.id !== comp.id)
      : [...outfitItems, comp];
    setOutfitItems(newItems);
    setAddedAll(false);
    await fetchOutfitScore(anchorItem, newItems);
  };

  // Add anchor to cart
  const handleAddAnchor = () => {
    addToCart({
      id: item.id, name: item.name, brand: item.brand,
      price: item.price, image_url: item.image_url, category: item.category,
    });
    setAnchorInCart(true);
    setCartCount(getCartCount());
  };

  // Add individual complement to cart
  const handleAddComplement = (comp: any) => {
    addToCart({
      id: comp.id, name: comp.name, brand: comp.brand,
      price: comp.price, image_url: comp.image_url, category: comp.category || "",
    });
    setCartCount(getCartCount());
  };

  // Add entire outfit to cart at once
  const handleAddEntireOutfit = () => {
    addToCart({
      id: item.id, name: item.name, brand: item.brand,
      price: item.price, image_url: item.image_url, category: item.category,
    });
    setAnchorInCart(true);
    outfitItems.forEach(comp => {
      addToCart({
        id: comp.id, name: comp.name, brand: comp.brand,
        price: comp.price, image_url: comp.image_url, category: comp.category || "",
      });
    });
    setAddedAll(true);
    setCartCount(getCartCount());
  };

  // Swap anchor item
  const handleSwapClick = (swap: typeof swaps[0]) => {
    setAnchorItem({
      id: swap.id, name: swap.name, brand: swap.brand,
      price: swap.price, rating: swap.rating, reviews: 0,
      category: anchorItem.category, image_url: swap.image_url,
      match_score: 100, promo: false,
    });
    setTab("complements");
  };

  // Total outfit price
  const outfitTotal = [item, ...outfitItems].reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
        <BackButton onClick={onBack} />
        <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</div>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Style Board</span>
        {cartCount > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 11, background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
            🛒 {cartCount} in cart
          </span>
        )}
        {loading && <span style={{ marginLeft: cartCount > 0 ? 8 : "auto", fontSize: 11, color: "#9ca3af" }}>Loading...</span>}
      </header>

      <main style={{ flex: 1, padding: 20, paddingBottom: outfitItems.length > 0 ? 140 : 20 }}>

        {/* Anchor product */}
        <div style={{ background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1.5px solid #c4b5fd", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
            <ProductImage url={item.image_url} size={64} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Your anchor item</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 2 }}>{item.name}</p>
              <p style={{ fontSize: 13, color: "#6d28d9" }}>{item.brand} · ${item.price}</p>
            </div>
          </div>
          {/* Add anchor to cart button */}
          <button onClick={handleAddAnchor} disabled={anchorInCart} style={{
            width: "100%", padding: "9px", borderRadius: 8, border: "none",
            background: anchorInCart ? "#f0fdf4" : "#7c3aed",
            color: anchorInCart ? "#059669" : "#fff",
            fontSize: 13, fontWeight: 600,
            cursor: anchorInCart ? "default" : "pointer",
          }}>
            {anchorInCart ? "✓ Added to Cart" : "🛒 Add to Cart"}
          </button>
        </div>

        {/* Outfit Score */}
        {outfitScore && <OutfitScoreCard score={outfitScore} />}

        {/* Outfit items strip */}
        {outfitItems.length > 0 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 8 }}>
              👗 Your Outfit ({outfitItems.length + 1} items · ${outfitTotal.toFixed(2)} total)
            </p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <ProductImage url={item.image_url} size={44} />
                <p style={{ fontSize: 10, color: "#166534", marginTop: 2, maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Anchor</p>
              </div>
              {outfitItems.map(i => (
                <div key={i.id} style={{ textAlign: "center", flexShrink: 0 }}>
                  <ProductImage url={i.image_url} size={44} />
                  <p style={{ fontSize: 10, color: "#166534", marginTop: 2, maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name?.split(" ")[0]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Complete the Look tab */}
        {tab === "complements" ? (
          <>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
              Tap an item to add it to your outfit and update the score.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {complements.map((p, i) => {
                const isAdded = !!outfitItems.find(o => o.id === p.id);
                const inCart  = isInCart(p.id ?? "");
                return (
                  <div key={p.id ?? i} style={{
                    background: isAdded ? "#f0fdf4" : "#f9fafb",
                    border: `1.5px solid ${isAdded ? "#059669" : "#f3f4f6"}`,
                    borderRadius: 12, padding: 14, transition: "all 0.15s",
                  }}>
                    {/* Item row — click to add to outfit */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer", marginBottom: isAdded ? 10 : 0 }}
                      onClick={() => toggleOutfitItem(p)}>
                      <ProductImage url={p.image_url} size={50} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{p.brand}</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{p.reason}</p>
                      </div>
                      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>${p.price}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                          background: isAdded ? "#059669" : "#e5e7eb",
                          color: isAdded ? "#fff" : "#6b7280",
                        }}>
                          {isAdded ? "✓ In Outfit" : "+ Add to Outfit"}
                        </span>
                      </div>
                    </div>

                    {/* Add to cart — shows only when item is in outfit */}
                    {isAdded && (
                      <button onClick={() => handleAddComplement(p)} disabled={inCart} style={{
                        width: "100%", padding: "7px", borderRadius: 8, border: "none",
                        background: inCart ? "#f0fdf4" : "#7c3aed",
                        color: inCart ? "#059669" : "#fff",
                        fontSize: 12, fontWeight: 600,
                        cursor: inCart ? "default" : "pointer",
                      }}>
                        {inCart ? "✓ Added to Cart" : "🛒 Add to Cart"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Smart Swaps tab */
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
                Swaps are scored on visual similarity · price delta · star rating · active promotions.
              </p>
            </div>
          </>
        )}
      </main>

      {/* Sticky — Add Entire Outfit to Cart */}
      {outfitItems.length > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1px solid #f3f4f6", padding: "14px 20px",
        }}>
          <button onClick={handleAddEntireOutfit} disabled={addedAll} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: addedAll ? "#f0fdf4" : "#7c3aed",
            color: addedAll ? "#059669" : "#fff",
            fontSize: 15, fontWeight: 700,
            cursor: addedAll ? "default" : "pointer",
          }}>
            {addedAll
              ? "✓ Entire Outfit Added to Cart"
              : `🛒 Add Entire Outfit to Cart · $${outfitTotal.toFixed(2)}`
            }
          </button>
        </div>
      )}
    </div>
  );
}