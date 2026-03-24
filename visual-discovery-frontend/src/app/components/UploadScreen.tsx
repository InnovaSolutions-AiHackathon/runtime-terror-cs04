"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { Logo } from "./shared";
import { searchByImage, searchByUrl, SearchResult } from "@/lib/mockData";
import { getSearchHistory, addToHistory, SearchHistoryItem } from "@/lib/wishlist";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadScreen({ onSearch }: { onSearch: (result?: SearchResult) => void }) {
  const [dragging,  setDragging]  = useState(false);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const [url,       setUrl]       = useState("");
  const [textQuery, setTextQuery] = useState("");
  const [mode,      setMode]      = useState<"upload" | "url" | "text">("upload");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const handleFile = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    const r = new FileReader();
    r.onload = e => setPreview(e.target?.result as string);
    r.readAsDataURL(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      let result;
      if (mode === "text" && textQuery) {
        const res = await fetch(`${API_URL}/search-by-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: textQuery }),
        });
        if (!res.ok) throw new Error("Text search failed");
        result = await res.json();
      } else if (mode === "url" && url) {
        result = await searchByUrl(url);
      } else if (file) {
        result = await searchByImage(file);
      } else {
        onSearch(undefined);
        return;
      }
      // Save to history
      if (mode === "text" && textQuery) {
        addToHistory({ type: "text", query: textQuery });
      } else if (mode === "url" && url) {
        addToHistory({ type: "url", query: url });
      } else if (file && preview) {
        addToHistory({ type: "image", query: file.name, preview });
      }
      setHistory(getSearchHistory());
      onSearch(result);
    } catch (err: any) {
      setError(err.message || "Search failed. Make sure backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const canSearch = Boolean(
    (mode === "upload" && (preview || file)) ||
    (mode === "url" && url) ||
    (mode === "text" && textQuery.trim())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo />
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Find products by photo or text</span>
      </header>

      {/* Body */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: 10 }}>
          See it. Find it. Style it.
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center", maxWidth: 440, marginBottom: 36, lineHeight: 1.6 }}>
          Upload a photo, paste a URL, or describe what you are looking for in words.
        </p>

        {/* Mode toggle — 3 tabs */}
        <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {(["upload", "url", "text"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#111827" : "#6b7280",
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {m === "upload" ? "📁 Upload" : m === "url" ? "🔗 URL" : "💬 Describe"}
            </button>
          ))}
        </div>

        {/* Upload zone */}
        {mode === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", maxWidth: 500,
              border: `2px dashed ${dragging ? "#7c3aed" : "#d1d5db"}`,
              borderRadius: 16, padding: "48px 24px", textAlign: "center",
              cursor: "pointer", background: dragging ? "#f5f3ff" : "#f9fafb",
              transition: "all 0.2s",
            }}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files?.[0])} />
            {preview ? (
              <>
                <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
                <p style={{ fontSize: 13, color: "#9ca3af" }}>Click to change photo</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Drop your photo here</p>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>or click to browse · PNG, JPG, WEBP</p>
              </>
            )}
          </div>
        )}

        {/* URL input */}
        {mode === "url" && (
          <input
            value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/product-image.jpg"
            style={{
              width: "100%", maxWidth: 500, padding: "14px 16px",
              borderRadius: 10, border: "1.5px solid #d1d5db",
              fontSize: 14, background: "#f9fafb", color: "#111827",
              outline: "none", boxSizing: "border-box" as const,
            }}
          />
        )}

        {/* Text search */}
        {mode === "text" && (
          <div style={{ width: "100%", maxWidth: 500 }}>
            <input
              value={textQuery}
              onChange={e => setTextQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSearch && handleSearch()}
              placeholder="e.g. brown leather belt, green salwar, red heels..."
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: 10, border: "1.5px solid #d1d5db",
                fontSize: 14, background: "#f9fafb", color: "#111827",
                outline: "none", boxSizing: "border-box" as const,
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {["brown leather belt", "red handbag", "blue denim jeans", "green salwar", "white sneakers"].map(s => (
                <button key={s} onClick={() => setTextQuery(s)} style={{
                  padding: "6px 12px", borderRadius: 99, border: "1px solid #e5e7eb",
                  fontSize: 12, color: "#6b7280", background: "#f9fafb", cursor: "pointer",
                }}>
                  {s}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10 }}>
              Powered by CLIP — describe color, type, material or style
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, maxWidth: 500, width: "100%" }}>
            {error}
          </div>
        )}

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={!canSearch || loading}
          style={{
            marginTop: 24, padding: "14px 48px",
            background: canSearch && !loading ? "#7c3aed" : "#e5e7eb",
            color: canSearch && !loading ? "#fff" : "#9ca3af",
            border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 600,
            cursor: canSearch && !loading ? "pointer" : "not-allowed",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Searching..." : mode === "text" ? "Search by Description →" : mode === "url" ? "Search by URL →" : "Search by Photo →"}
        </button>

        <button onClick={() => onSearch(undefined)} style={{
          marginTop: 12, background: "none", border: "none",
          color: "#9ca3af", fontSize: 12, cursor: "pointer", textDecoration: "underline",
        }}>
          Skip — use demo data
        </button>
        {history.length > 0 && (
          <div style={{ width: "100%", maxWidth: 500, marginTop: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 10 }}>
              Recent searches
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map(h => (
                <button
                  key={h.id}
                  onClick={() => {
                    if (h.type === "text") {
                      setMode("text");
                      setTextQuery(h.query);
                    } else if (h.type === "url") {
                      setMode("url");
                      setUrl(h.query);
                    } else if (h.preview) {
                      setMode("upload");
                      setPreview(h.preview);
                      // Convert base64 preview back to File object
                      fetch(h.preview)
                        .then(res => res.blob())
                        .then(blob => {
                          const f = new File([blob], h.query || "image.jpg", { type: blob.type || "image/jpeg" });
                          setFile(f);
                        });
                    }
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 10,
                    border: "1px solid #f3f4f6", background: "#f9fafb",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: "#ede9fe", display: "flex", alignItems: "center",
                    justifyContent: "center", overflow: "hidden",
                  }}>
                    {h.type === "image" && h.preview ? (
                      <img src={h.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 16 }}>
                        {h.type === "text" ? "💬" : "🔗"}
                      </span>
                    )}
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.query}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                      {h.type === "text" ? "Text search" : h.type === "url" ? "URL search" : "Image search"}
                      {" · "}{new Date(h.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}