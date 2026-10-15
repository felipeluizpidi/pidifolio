import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSettings } from "@/lib/queries";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 300;

export default async function Icon() {
  const s = await getSettings();
  const initials = s.name.full
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const archivoBlack = await readFile(path.join(process.cwd(), "node_modules", "@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B0B",
          color: "#F4E9D6",
          fontFamily: "Heavy",
          fontSize: 17,
          letterSpacing: -0.5,
        }}
      >
        {initials}®
      </div>
    ),
    { ...size, fonts: [{ name: "Heavy", data: archivoBlack, weight: 400 }] },
  );
}
