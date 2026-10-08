import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSettings } from "@/lib/queries";

export const alt = "Felipe Pidi — AI Creative & Design Leader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 300;

export default async function OG() {
  const s = await getSettings();
  const font = (f: string) => readFile(path.join(process.cwd(), "node_modules", f));
  const [anton, mono] = await Promise.all([
    font("@fontsource/anton/files/anton-latin-400-normal.woff"),
    font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff"),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0B0B0B", color: "#F4E9D6", padding: 48, fontFamily: "Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 3 }}>
          <span>FRAME 001 / CREATIVE DIRECTION</span>
          <span>SÃO PAULO — WORLDWIDE</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Anton", color: "#EF2917", fontSize: 250, lineHeight: 0.84, textTransform: "uppercase" }}>
          <span>{s.name.first}</span>
          <span style={{ alignSelf: "flex-end" }}>{s.name.last}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 3, borderTop: "1px solid rgba(244,233,214,.3)", paddingTop: 16 }}>
          <span>{s.role.toUpperCase()}</span>
          <span>PORTFOLIO 2026</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Anton", data: anton, weight: 400 }, { name: "Mono", data: mono, weight: 400 }] },
  );
}
