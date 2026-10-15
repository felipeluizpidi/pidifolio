import { Hero } from "@/components/site/Hero";
import { ClientLogos } from "@/components/site/ClientLogos";
import { CareerStats } from "@/components/site/CareerStats";
import { SelectedWork } from "@/components/site/SelectedWork";
import { Archive } from "@/components/site/Archive";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { getHomeData } from "@/lib/queries";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-ivory/15 bg-ink py-3 text-ivory" aria-hidden>
      <div className="marquee flex w-max gap-8 whitespace-nowrap">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="t-meta flex items-center gap-8">
            {t} <span className="text-red">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = getDictionary(locale);
  const { settings: s, categories, featured, archive, media, clients } = await getHomeData(locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.name.full,
    jobTitle: s.role,
    address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressCountry: "BR" },
    sameAs: [s.social.linkedin, s.social.behance, s.social.instagram].filter(Boolean),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero s={s} desktop={media[s.hero.portraitDesktopId ?? ""]} mobile={media[s.hero.portraitMobileId ?? ""]} dict={dict} />
      <ClientLogos clients={clients} media={media} dict={dict} />
      <CareerStats s={s} dict={dict} />
      <Marquee items={s.about.disciplines} />
      <SelectedWork s={s} projects={featured} media={media} dict={dict} />
      <Archive s={s} categories={categories} projects={archive} dict={dict} />
      <About s={s} portrait={media[s.about.portraitId ?? ""]} dict={dict} />
      <Contact s={s} locale={locale} dict={dict} />
    </>
  );
}
