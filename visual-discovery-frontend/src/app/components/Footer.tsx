export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid #f3f4f6",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: "#fff",
    }}>
      <span style={{ fontSize: 12, color: "#9ca3af" }}>Built by team </span>
      <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>Runtime Terror</span>
      <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
      <span style={{ fontSize: 12, color: "#9ca3af" }}>AI Hackathon 2026</span>
    </footer>
  );
}