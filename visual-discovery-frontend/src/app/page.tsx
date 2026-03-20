"use client";
import { useState } from "react";
import UploadScreen     from "./components/UploadScreen";
import ResultsScreen    from "./components/ResultsScreen";
import StyleBoardScreen from "./components/StyleBoardScreen";
import { MOCK_PRODUCTS, SearchResult } from "@/lib/mockData";

type Screen  = "upload" | "results" | "styleboard";
type Product = typeof MOCK_PRODUCTS[0];

export default function Home() {
  const [screen,       setScreen]       = useState<Screen>("upload");
  const [anchor,       setAnchor]       = useState<Product | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
      {screen === "upload" && (
        <UploadScreen
          onSearch={result => {
            setSearchResult(result || null);
            setScreen("results");
          }}
        />
      )}
      {screen === "results" && (
        <ResultsScreen
          searchResult={searchResult}
          onComplete={p => { setAnchor(p); setScreen("styleboard"); }}
          onBack={() => setScreen("upload")}
        />
      )}
      {screen === "styleboard" && (
        <StyleBoardScreen
          anchor={anchor}
          onBack={() => setScreen("results")}
        />
      )}
    </main>
  );
}