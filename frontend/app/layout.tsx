import "./globals.css";
import { Fraunces, Outfit } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-[--color-cream] font-[family-name:var(--font-outfit)] text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
