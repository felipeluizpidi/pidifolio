import type { Metadata, Viewport } from "next";
import "@fontsource/anton/400.css";
import "@fontsource/archivo-black/400.css";
import "@fontsource-variable/space-grotesk/index.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { getSettings } from "@/lib/queries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.seo.title, template: `%s — ${s.name.full}` },
    description: s.seo.description,
    openGraph: { type: "website", siteName: s.name.full, title: s.seo.title, description: s.seo.description, locale: "en_US" },
    twitter: { card: "summary_large_image", title: s.seo.title, description: s.seo.description },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#0B0B0B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
