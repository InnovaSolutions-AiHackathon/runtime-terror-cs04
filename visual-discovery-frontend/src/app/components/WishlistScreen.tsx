"use client";
import { useState, useEffect } from "react";
import { getWishlist, removeFromWishlist, WishlistItem } from "@/lib/wishlist";
import { StarRating, Badge, BackButton } from "./shared";

export default function WishlistScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setItems(getWishlist());
  }, []);

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
    setItems(getWishlist());
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
        <BackButton onClick={onBack} />
        <div style={{ width: 28, height: 28, background: "#e11d48", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>♥</div>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Wishlist</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{items.length} items</span>
      </header>

      <main style={{ flex: 1, padding: 20 }}>
        {items.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 12 }}>
            <div style={{ fontSize: 56 }}>🛍️</div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#374151" }}>Your wishlist is empty</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Tap the ♥ on any product to save it here</p>
            <button onClick={onBack} style={{
              marginTop: 8, padding: "10px 24px", background: "#7c3aed",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Start Browsing →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map(item => (
              <div key={item.id} style={{
                background: "#f9fafb", border: "1px solid #f3f4f6",
                borderRadius: 14, padding: 14, display: "flex", gap: 12, alignItems: "center",
              }}>
                {/* Image */}
                <div style={{
                  width: 70, height: 70, background: "#fff", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, overflow: "hidden",
                }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                  ) : (
                    <span style={{ fontSize: 28 }}>🛍️</span>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{item.brand}</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#1f2937", marginBottom: 4, lineHeight: 1.3 }}>{item.name}</p>
                  <StarRating rating={item.rating} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>${item.price}</span>
                    <Badge color="blue">{item.category}</Badge>
                    {item.promo && <Badge color="green">SALE</Badge>}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.id)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: "1px solid #fecaca", background: "#fef2f2",
                    color: "#e11d48", fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  ♥
                </button>
              </div>
            ))}

            {/* Clear all */}
            <button
              onClick={() => { if (confirm("Clear all wishlist items?")) { localStorage.removeItem("vd_wishlist"); setItems([]); } }}
              style={{
                marginTop: 8, padding: "10px", background: "none",
                border: "1px solid #e5e7eb", borderRadius: 10,
                color: "#9ca3af", fontSize: 13, cursor: "pointer",
              }}
            >
              Clear wishlist
            </button>
          </div>
        )}
      </main>
    </div>
  );
}