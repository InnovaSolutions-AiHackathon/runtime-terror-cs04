import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visual Discovery",
  description: "Find products by photo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
