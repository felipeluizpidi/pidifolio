import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { READ_ONLY, READ_ONLY_MESSAGE } from "@/lib/store";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }
  return (
    <div className="lg:grid lg:min-h-[100svh] lg:grid-cols-[220px_1fr]">
      <aside className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-ivory/15 bg-ink px-4 py-3 lg:h-[100svh] lg:flex-col lg:items-stretch lg:justify-start lg:border-b-0 lg:border-r lg:py-6">
        <Link href="/admin" className="t-meta flex items-center gap-2">
          <span className="font-heavy text-[15px]">FP®</span> Edit suite
        </Link>
        <AdminNav />
        <div className="flex items-center gap-3 lg:mt-auto lg:block lg:space-y-2">
          <Link href="/" target="_blank" className="t-meta block text-ash hover:text-ivory">View site ↗</Link>
          <form action={logout}>
            <button className="t-meta text-ash hover:text-red" type="submit">Log out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 lg:px-8 lg:py-8">
        {READ_ONLY && <p role="alert" className="mb-6 border border-orange/60 bg-orange/10 px-3 py-2 text-[13px] text-orange">{READ_ONLY_MESSAGE}</p>}
        {children}
      </main>
    </div>
  );
}
