import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Register from "./register";
const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = { title: "DayFlow", description: "Agenda et tâches synchronisés sur tous vos appareils", manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "DayFlow", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon-192.png", type: "image/png", sizes: "192x192" }], apple: "/apple-touch-icon.png" } };
export const viewport: Viewport = { themeColor: "#0F0B1A", viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr" className="dark" suppressHydrationWarning><body className={`${font.variable} font-sans`}><Register />{children}</body></html>;
}
