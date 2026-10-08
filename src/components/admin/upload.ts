import type { MediaAsset } from "@/lib/types";

export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,application/pdf";
const MB = 1024 * 1024;
const LIMITS: Record<string, number> = {
  "image/jpeg": 20 * MB,
  "image/png": 20 * MB,
  "image/webp": 20 * MB,
  "image/avif": 20 * MB,
  "video/mp4": 400 * MB,
  "video/webm": 400 * MB,
  "application/pdf": 15 * MB,
};

/** Client-side pre-check (the server re-validates everything). */
export function precheck(file: File): string | null {
  const limit = LIMITS[file.type];
  if (!limit) return `${file.name}: unsupported type (${file.type || "unknown"}). Use JPG, PNG, WebP, AVIF, MP4, WebM or PDF.`;
  if (file.size > limit) return `${file.name}: ${(file.size / MB).toFixed(1)} MB is over the ${limit / MB} MB limit.`;
  return null;
}

async function dimensions(file: File): Promise<{ width?: number; height?: number }> {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight };
    }
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      await new Promise<void>((res, rej) => {
        v.onloadedmetadata = () => res();
        v.onerror = () => rej();
      });
      return { width: v.videoWidth, height: v.videoHeight };
    }
  } catch {
    /* dimensions are optional */
  } finally {
    URL.revokeObjectURL(url);
  }
  return {};
}

export async function uploadFile(file: File, onProgress: (pct: number) => void): Promise<MediaAsset> {
  const { width, height } = await dimensions(file);
  const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-alt", encodeURIComponent(alt));
    if (width) xhr.setRequestHeader("x-width", String(width));
    if (height) xhr.setRequestHeader("x-height", String(height));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { asset?: MediaAsset; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.asset) resolve(body.asset);
      else reject(new Error(body.error || `Upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
