import type { MediaAsset, Settings } from "./types";

export function cvHref(s: Settings, media: Record<string, MediaAsset>) {
  if (s.cv.assetId && media[s.cv.assetId]) return media[s.cv.assetId].src;
  return s.cv.url || undefined;
}
