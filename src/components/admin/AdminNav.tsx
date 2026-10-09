"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/admin", label: "Projects" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 lg:mt-8 lg:flex-col">
      {LINKS.map((l) => {
        const on = l.href === "/admin" ? path === "/admin" || path.startsWith("/admin/projects") : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined} className={clsx("t-meta px-2 py-2 transition-colors", on ? "bg-ivory text-ink" : "text-ash hover:text-ivory")}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
