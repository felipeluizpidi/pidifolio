import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifySession } from "./lib/session";
import { isLocale, localeCookie, pickLocale } from "./lib/i18n";

/** First line of defense; every server action and API route re-checks. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value, sessionSecret());
    if (ok) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Site pages: redirect bare paths to a locale ("/" → "/en"), detected from the
  // saved cookie or the browser's Accept-Language header, defaulting to English.
  const [, first] = pathname.split("/");
  if (isLocale(first)) {
    const res = NextResponse.next();
    if (req.cookies.get(localeCookie)?.value !== first) {
      res.cookies.set(localeCookie, first, { maxAge: 60 * 60 * 24 * 365, path: "/" });
    }
    return res;
  }
  const saved = req.cookies.get(localeCookie)?.value;
  const locale = isLocale(saved) ? saved : pickLocale(req.headers.get("accept-language"));
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|api|media|admin|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\..*).*)"],
};
