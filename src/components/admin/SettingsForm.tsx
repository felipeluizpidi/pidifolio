"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { MediaAsset, Settings } from "@/lib/types";
import { saveSettings } from "@/app/admin/actions";
import { Button, Field, Input, LinesInput, Notice, Section, Textarea } from "./ui";
import { MediaField, MediaPicker, MediaThumb } from "./MediaKit";
import { SortableList } from "./Sortable";

export function SettingsForm({ settings, media: initialMedia }: { settings: Settings; media: MediaAsset[] }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [savedJson, setSavedJson] = useState(JSON.stringify(settings));
  const [media, setMedia] = useState(initialMedia);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(s) !== savedJson;
  const addMedia = (a: MediaAsset) => setMedia((m) => [a, ...m]);
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const byId = Object.fromEntries(media.map((m) => [m.id, m]));

  /** Immutable update by path, e.g. up("hero", "lead", value) */
  const up = <K extends Exclude<keyof Settings, "role">, F extends keyof Settings[K]>(k: K, f: F, v: Settings[K][F]) =>
    setS((x) => ({ ...x, [k]: { ...(x[k] as object), [f]: v } }));

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    start(async () => {
      const r = await saveSettings(s);
      if (r.ok) {
        setSavedJson(JSON.stringify(s));
        setMsg({ kind: "ok", text: "Settings saved — the site is updated." });
        router.refresh();
      } else setMsg({ kind: "error", text: r.error });
    });

  return (
    <div className="space-y-6 pb-28">
      <header>
        <p className="t-meta text-ash">Global</p>
        <h1 className="t-display text-[56px] md:text-[80px]">Settings</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Identity">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="First name (hero line 1)">
              <Input value={s.name.first} onChange={(e) => up("name", "first", e.target.value)} />
            </Field>
            <Field label="Last name (hero line 2)">
              <Input value={s.name.last} onChange={(e) => up("name", "last", e.target.value)} />
            </Field>
            <Field label="Full name">
              <Input value={s.name.full} onChange={(e) => up("name", "full", e.target.value)} />
            </Field>
          </div>
          <Field label="Professional title">
            <Input value={s.role} onChange={(e) => setS({ ...s, role: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SEO title">
              <Input value={s.seo.title} onChange={(e) => up("seo", "title", e.target.value)} />
            </Field>
            <Field label="SEO description">
              <Textarea rows={2} value={s.seo.description} onChange={(e) => up("seo", "description", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Hero" hint="Desktop and mobile portraits are art-directed separately.">
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaField label="Portrait — desktop (landscape)" value={s.hero.portraitDesktopId} onChange={(v) => up("hero", "portraitDesktopId", v)} kinds={["image"]} media={media} onUploaded={addMedia} />
            <MediaField label="Portrait — mobile (vertical)" ratio="aspect-[9/16]" value={s.hero.portraitMobileId} onChange={(v) => up("hero", "portraitMobileId", v)} kinds={["image"]} media={media} onUploaded={addMedia} />
          </div>
          <Field label="Title lines">
            <LinesInput value={s.hero.roleLines} onChange={(v) => up("hero", "roleLines", v)} rows={2} />
          </Field>
          <Field label="Supporting text">
            <Textarea rows={2} value={s.hero.lead} onChange={(e) => up("hero", "lead", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Metadata (3 lines)" hint="Location / availability / edition">
              <LinesInput value={s.hero.meta} onChange={(v) => up("hero", "meta", v)} rows={3} />
            </Field>
            <Field label="Scroll call-to-action">
              <Input value={s.hero.cta} onChange={(e) => up("hero", "cta", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Section headlines">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Selected Work — headline lines">
              <LinesInput value={s.selectedWork.headline} onChange={(v) => up("selectedWork", "headline", v)} rows={2} />
            </Field>
            <Field label="Selected Work — subtitle">
              <Textarea rows={2} value={s.selectedWork.subtitle} onChange={(e) => up("selectedWork", "subtitle", e.target.value)} />
            </Field>
            <Field label="Archive — headline lines">
              <LinesInput value={s.archive.headline} onChange={(v) => up("archive", "headline", v)} rows={2} />
            </Field>
            <Field label="Archive — subtitle">
              <Textarea rows={2} value={s.archive.subtitle} onChange={(e) => up("archive", "subtitle", e.target.value)} />
            </Field>
          </div>
          <p className="text-[12px] text-ash">Featured project order lives on the Projects screen.</p>
        </Section>

        <Section title="Contact">
          <Field label="Headline lines">
            <LinesInput value={s.contact.headline} onChange={(v) => up("contact", "headline", v)} rows={3} />
          </Field>
          <Field label="Supporting copy">
            <Textarea rows={2} value={s.contact.copy} onChange={(e) => up("contact", "copy", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Email">
              <Input type="email" value={s.contact.email} onChange={(e) => up("contact", "email", e.target.value)} />
            </Field>
            <Field label="Location">
              <Input value={s.contact.location} onChange={(e) => up("contact", "location", e.target.value)} />
            </Field>
            <Field label="Availability">
              <Input value={s.contact.availability} onChange={(e) => up("contact", "availability", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn URL">
              <Input value={s.social.linkedin} onChange={(e) => up("social", "linkedin", e.target.value)} />
            </Field>
            <Field label="Behance URL">
              <Input value={s.social.behance} onChange={(e) => up("social", "behance", e.target.value)} />
            </Field>
            <Field label="Instagram URL">
              <Input value={s.social.instagram ?? ""} placeholder="https://www.instagram.com/…" onChange={(e) => up("social", "instagram", e.target.value || undefined)} />
            </Field>
            <Field label="WhatsApp number" hint="Digits only, with country code — e.g. 5511983829395">
              <Input inputMode="numeric" value={s.social.whatsapp ?? ""} placeholder="5511…" onChange={(e) => up("social", "whatsapp", e.target.value.replace(/\D/g, "") || undefined)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Footer signature">
              <Input value={s.footer.signature} onChange={(e) => up("footer", "signature", e.target.value)} />
            </Field>
            <Field label="Footer tagline">
              <Input value={s.footer.tagline} onChange={(e) => up("footer", "tagline", e.target.value)} />
            </Field>
          </div>
        </Section>
      </div>

      <Section title="About">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <MediaField label="Portrait (shown in black & white)" ratio="aspect-[4/5]" value={s.about.portraitId} onChange={(v) => up("about", "portraitId", v)} kinds={["image"]} media={media} onUploaded={addMedia} />
            <MediaField label="CV file (PDF)" ratio="aspect-[3/4]" value={s.cv.assetId} onChange={(v) => up("cv", "assetId", v)} kinds={["file"]} media={media} onUploaded={addMedia} />
            <Field label="…or CV link" hint="Used only if no PDF is selected">
              <Input value={s.cv.url ?? ""} placeholder="https://" onChange={(e) => up("cv", "url", e.target.value || undefined)} />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Headline lines">
              <LinesInput value={s.about.headline} onChange={(v) => up("about", "headline", v)} rows={2} />
            </Field>
            <Field label="Biography" hint="Blank line = new paragraph">
              <Textarea
                rows={10}
                value={s.about.bio.join("\n\n")}
                onChange={(e) => up("about", "bio", e.target.value.split(/\n{2,}/))}
                onBlur={(e) => up("about", "bio", e.target.value.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean))}
              />
            </Field>
            <Field label="Disciplines (one per line)">
              <LinesInput value={s.about.disciplines} onChange={(v) => up("about", "disciplines", v)} rows={6} />
            </Field>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="t-meta-sm text-ash">Career numbers (strip under the hero) — only real figures</span>
                <Button variant="ghost" onClick={() => up("about", "metrics", [...s.about.metrics, { value: "", label: "" }])}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {s.about.metrics.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input className="w-24" value={m.value} placeholder="12+" onChange={(e) => up("about", "metrics", s.about.metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    <Input value={m.label} placeholder="Years in design" onChange={(e) => up("about", "metrics", s.about.metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                    <Button variant="ghost" aria-label="Remove" onClick={() => up("about", "metrics", s.about.metrics.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Photography" hint="One section inside the Archive. Add, remove and drag to reorder — upload new photos straight from the picker.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline lines">
            <LinesInput value={s.photography.headline} onChange={(v) => up("photography", "headline", v)} rows={2} />
          </Field>
          <Field label="Subtitle">
            <Textarea rows={2} value={s.photography.subtitle} onChange={(e) => up("photography", "subtitle", e.target.value)} />
          </Field>
        </div>
        <div className="space-y-3">
          <span className="t-meta-sm block text-ash">{s.photography.photoIds.length} photos — the section hides itself when empty</span>
          {s.photography.photoIds.length > 0 && (
            <SortableList
              grid
              items={s.photography.photoIds.map((id) => ({ id }))}
              onReorder={(next) => up("photography", "photoIds", next.map((x) => x.id))}
              className="flex flex-wrap gap-2"
              render={(it, handle) => (
                <div className="flex items-center border border-ivory/15">
                  {handle}
                  <MediaThumb asset={byId[it.id]} media={byId} className="h-20 w-14" />
                </div>
              )}
            />
          )}
          <Button onClick={() => setPickingPhotos(true)}>
            <Plus className="h-3.5 w-3.5" /> {s.photography.photoIds.length ? "Add / remove photos" : "Choose photos"}
          </Button>
          {pickingPhotos && (
            <MediaPicker
              multiple
              title="Photography"
              media={media}
              kinds={["image"]}
              initial={s.photography.photoIds}
              onUploaded={addMedia}
              onClose={() => setPickingPhotos(false)}
              onConfirm={(ids) => {
                up("photography", "photoIds", ids);
                setPickingPhotos(false);
              }}
            />
          )}
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ivory/15 bg-ink/95 px-4 py-3 backdrop-blur lg:left-[220px] lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">{msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : <span className="t-meta-sm text-ash">{dirty ? "● Unsaved changes" : "All changes saved"}</span>}</div>
          <Button variant="primary" onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
