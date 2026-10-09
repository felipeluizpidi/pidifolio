import { Hero } from "@/components/site/Hero";
import { CareerStats } from "@/components/site/CareerStats";
import { SelectedWork } from "@/components/site/SelectedWork";
import { Archive } from "@/components/site/Archive";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { getHomeData } from "@/lib/queries";
import { cvHref } from "@/lib/cv";

export const revalidate = 300;

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

export default async function Home() {
  const { settings: s, categories, featured, archive, media } = await getHomeData();
  const cv = cvHref(s, media);
  const photos = s.photography.photoIds.map((id) => media[id]).filter((m) => m?.kind === "image");
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
      <Hero s={s} desktop={media[s.hero.portraitDesktopId ?? ""]} mobile={media[s.hero.portraitMobileId ?? ""]} />
      <CareerStats s={s} />
      <Marquee items={s.about.disciplines} />
      <SelectedWork s={s} projects={featured} media={media} />
      <Archive s={s} categories={categories} projects={archive} photos={photos} />
      <About s={s} portrait={media[s.about.portraitId ?? ""]} cvHref={cv} />
      <Contact s={s} cvHref={cv} />
    </>
  );
}
