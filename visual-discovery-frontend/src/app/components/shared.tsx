export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(Math.floor(rating))}
      {"☆".repeat(5 - Math.floor(rating))}
      <span className="text-gray-400 ml-1">{rating}</span>
    </span>
  );
}

type BadgeColor = "purple" | "green" | "amber" | "blue";
const badgeClasses: Record<BadgeColor, string> = {
  purple: "bg-purple-100 text-purple-700",
  green:  "bg-green-100  text-green-700",
  amber:  "bg-amber-100  text-amber-700",
  blue:   "bg-blue-100   text-blue-700",
};

export function Badge({ children, color = "purple" }: { children: React.ReactNode; color?: BadgeColor }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${badgeClasses[color]}`}>
      {children}
    </span>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
    >
      ← Back
    </button>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`bg-purple-600 rounded-lg flex items-center justify-center ${size === "sm" ? "w-7 h-7 text-sm" : "w-8 h-8 text-base"}`}>
        🔍
      </div>
      <span className={`font-semibold text-gray-900 ${size === "sm" ? "text-base" : "text-lg"}`}>
        Visual Discovery
      </span>
    </div>
  );
}

export function extractBrand(name: string): string {
  if (!name) return "";
  const genderWords = ["women", "men", "boys", "girls", "unisex"];
  const nameLower = name.toLowerCase();
  for (const g of genderWords) {
    const idx = nameLower.indexOf(g);
    if (idx > 0) {
      const brand = name.substring(0, idx).trim();
      if (brand) return brand;
    }
  }
  return name.split(" ")[0];
}
