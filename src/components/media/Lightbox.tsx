"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { MediaAsset } from "@/lib/types";
import { EmbedPlayer, VideoPlayer } from "./Video";

type Props = {
  items: MediaAsset[];
  index: number | null;
  onIndex: (i: number | null) => void;
  posters: Record<string, MediaAsset>;
};

export function Lightbox({ items, index, onIndex, posters }: Props) {
  const open = index !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (d: number) => {
      if (index === null) return;
      onIndex((index + d + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        // focus trap
        const f = dialogRef.current.querySelectorAll<HTMLElement>("button, [href], input, iframe, video, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocus.current?.focus?.();
    };
  }, [open, go, onIndex]);

  const item = index !== null ? items[index] : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Media viewer"
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex flex-col bg-ink/95 text-ivory outline-none backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="gutter flex h-14 items-center justify-between">
            <span className="t-meta tabular-nums">
              Frame {String(index! + 1).padStart(3, "0")} / {String(items.length).padStart(3, "0")}
            </span>
            <button type="button" onClick={() => onIndex(null)} className="flex h-11 w-11 items-center justify-center" aria-label="Close viewer">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="relative flex-1 px-2 md:px-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id + index}
                className="absolute inset-0 flex items-center justify-center px-2 md:px-20"
                initial={{ opacity: 0, clipPath: "inset(0 0 0 12%)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0 0%)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {item.kind === "image" ? (
                  <div className="relative h-full w-full">
                    <Image src={item.src} alt={item.alt} fill sizes="100vw" className="object-contain" />
                  </div>
                ) : item.kind === "video" ? (
                  <VideoPlayer
                    src={item.src}
                    poster={item.posterId ? posters[item.posterId]?.src : undefined}
                    label={item.alt || "Video"}
                    className="max-h-full"
                    aspect={item.width && item.height ? item.width / item.height : 16 / 9}
                  />
                ) : (
                  <EmbedPlayer url={item.src} label={item.alt || "Video"} className="max-w-6xl" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="gutter flex min-h-16 items-center justify-between gap-4 py-2">
            <p className="t-meta max-w-xl text-ivory/70">{item.caption || item.alt}</p>
            {items.length > 1 && (
              <div className="flex gap-1">
                <button type="button" onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center border border-ivory/30 hover:bg-ivory hover:text-ink" aria-label="Previous">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center border border-ivory/30 hover:bg-ivory hover:text-ink" aria-label="Next">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
