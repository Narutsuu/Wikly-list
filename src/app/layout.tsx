import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Register from "./register";
const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = { title: "DayFlow", manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "DayFlow", statusBarStyle: "default" }, icons: { apple: "/icon-192.png" } };
export const viewport: Viewport = { themeColor: "#10202B", viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body className={`${font.variable} font-sans`}><Register />{children}</body></html>;
}
