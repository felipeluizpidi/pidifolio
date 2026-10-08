export type ParsedEmbed = { provider: "youtube" | "vimeo"; id: string; embedUrl: string; thumb?: string };

export function parseEmbed(url: string): ParsedEmbed | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      id = m?.[1] ?? "";
    }
    if (!/^[\w-]{6,20}$/.test(id)) return null;
    return {
      provider: "youtube",
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      thumb: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(?:^|\/)(\d{5,12})(?:\/|$)/);
    if (!m) return null;
    const hash = u.searchParams.get("h");
    return {
      provider: "vimeo",
      id: m[1],
      embedUrl: `https://player.vimeo.com/video/${m[1]}?autoplay=1&dnt=1${hash ? `&h=${encodeURIComponent(hash)}` : ""}`,
    };
  }
  return null;
}
