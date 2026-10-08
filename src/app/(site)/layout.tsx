import { Nav } from "@/components/site/Nav";
import { MotionRoot } from "@/components/site/Motion";
import { getSettings } from "@/lib/queries";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <MotionRoot>
      <a href="#main" className="t-meta sr-only z-[100] bg-ivory p-3 text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <Nav name={s.name.full} email={s.contact.email} linkedin={s.social.linkedin} behance={s.social.behance} />
      <main id="main">{children}</main>
      <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
        <div className="grain" />
      </div>
    </MotionRoot>
  );
}
