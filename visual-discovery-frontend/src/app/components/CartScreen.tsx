"use client";
import { useState, useEffect } from "react";
import { getCart, removeFromCart, updateCartQuantity, getCartTotal, clearCart, CartItem } from "@/lib/wishlist";
import { BackButton } from "./shared";

export default function CartScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => { setItems(getCart()); }, []);

  const handleRemove = (id: string) => {
    removeFromCart(id);
    setItems(getCart());
  };

  const handleQuantity = (id: string, qty: number) => {
    updateCartQuantity(id, qty);
    setItems(getCart());
  };

  const total    = getCartTotal();
  const subtotal = total;
  const shipping = total > 100 ? 0 : 9.99;
  const grandTotal = subtotal + shipping;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
        <BackButton onClick={onBack} />
        <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🛒</div>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>My Cart</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{items.length} items</span>
      </header>

      <main style={{ flex: 1, padding: 20, paddingBottom: 160 }}>
        {items.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 12 }}>
            <div style={{ fontSize: 56 }}>🛒</div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#374151" }}>Your cart is empty</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Add products from search results</p>
            <button onClick={onBack} style={{
              marginTop: 8, padding: "10px 24px", background: "#7c3aed",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Continue Shopping →
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  background: "#f9fafb", border: "1px solid #f3f4f6",
                  borderRadius: 14, padding: 14, display: "flex", gap: 12, alignItems: "center",
                }}>
                  {/* Image */}
                  <div style={{ width: 70, height: 70, background: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                    ) : (
                      <span style={{ fontSize: 28 }}>🛍️</span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{item.brand}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1f2937", marginBottom: 6, lineHeight: 1.3 }}>{item.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>${(item.price * item.quantity).toFixed(2)}</p>

                    {/* Quantity controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <button onClick={() => handleQuantity(item.id, item.quantity - 1)} style={{
                        width: 24, height: 24, borderRadius: "50%", border: "1px solid #e5e7eb",
                        background: "#fff", cursor: "pointer", fontSize: 14, display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#374151",
                      }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => handleQuantity(item.id, item.quantity + 1)} style={{
                        width: 24, height: 24, borderRadius: "50%", border: "1px solid #e5e7eb",
                        background: "#fff", cursor: "pointer", fontSize: 14, display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#374151",
                      }}>+</button>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>${item.price} each</span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button onClick={() => handleRemove(item.id)} style={{
                    width: 28, height: 28, borderRadius: "50%", border: "1px solid #fecaca",
                    background: "#fef2f2", color: "#e11d48", fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>×</button>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Order Summary</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Subtotal</span>
                  <span style={{ fontSize: 13, color: "#111827" }}>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Shipping</span>
                  <span style={{ fontSize: 13, color: shipping === 0 ? "#059669" : "#111827" }}>
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>
                    Add ${(100 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Total</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed" }}>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Clear cart */}
            <button
              onClick={() => { if (confirm("Clear cart?")) { clearCart(); setItems([]); } }}
              style={{ marginTop: 12, width: "100%", padding: "10px", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, color: "#9ca3af", fontSize: 13, cursor: "pointer" }}
            >
              Clear cart
            </button>
          </>
        )}
      </main>

      {/* Checkout button */}
      {items.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #f3f4f6", padding: "16px 20px" }}>
          <button
            onClick={() => alert("Checkout coming soon! 🚀")}
            style={{
              width: "100%", padding: "14px", background: "#7c3aed",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}
          >
            Checkout · ${grandTotal.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}