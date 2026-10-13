import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { MotionRoot } from "@/components/site/Motion";
import { getSettings } from "@/lib/queries";
import { socialLinks } from "@/lib/social";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const s = await getSettings(locale);
  return {
    title: { absolute: s.seo.title, template: `%s — ${s.name.full}` },
    description: s.seo.description,
    openGraph: { locale: { pt: "pt_BR", en: "en_US", es: "es_ES" }[locale] },
    alternates: { canonical: `/${locale}`, languages: { pt: "/pt", en: "/en", es: "/es" } },
  };
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const s = await getSettings();
  const dict = getDictionary(locale);
  return (
    <MotionRoot>
      <a href="#main" className="t-meta sr-only z-[100] bg-ivory p-3 text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <Nav name={s.name.full} email={s.contact.email} links={socialLinks(s, dict)} locale={locale} dict={dict} />
      <main id="main">{children}</main>
      <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
        <div className="grain" />
      </div>
    </MotionRoot>
  );
}
