"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { parseEmbed } from "@/lib/embed";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Observes visibility; returns ref + whether ≥ threshold is on screen. */
function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/**
 * Silent ambient video for covers/previews. Never plays audio.
 * - `mode="visible"`: plays while on screen.
 * - `mode="hover"`: plays only while `active` is true (and on screen).
 * Source isn't attached until first needed, so offscreen videos cost nothing.
 */
export function AmbientVideo({
  src,
  poster,
  active = true,
  mode = "visible",
  className,
}: {
  src: string;
  poster?: string;
  active?: boolean;
  mode?: "visible" | "hover";
  className?: string;
}) {
  const [wrapRef, inView] = useInView<HTMLDivElement>(0.2);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);
  const shouldPlay = !reduced && inView && (mode === "visible" || active);

  useEffect(() => {
    if (shouldPlay) setArmed(true);
  }, [shouldPlay]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !armed) return;
    if (shouldPlay) v.play().catch(() => {});
    else v.pause();
  }, [shouldPlay, armed]);

  return (
    <div ref={wrapRef} className={clsx("absolute inset-0", className)} aria-hidden>
      <video
        ref={videoRef}
        src={armed ? src : undefined}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        className={clsx(
          "h-full w-full object-cover transition-opacity duration-500",
          mode === "hover" && !active ? "opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
}

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/** Full player: play/pause, mute, scrubbable progress, fullscreen, poster fallback. */
export function VideoPlayer({
  src,
  poster,
  label,
  autoplay = false,
  aspect,
  className,
}: {
  src: string;
  poster?: string;
  label: string;
  autoplay?: boolean;
  aspect?: number;
  className?: string;
}) {
  const [wrapRef, inView] = useInView<HTMLDivElement>(0.5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [fs, setFs] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const userPaused = useRef(false);

  // Autoplay silently when visible (unless user paused); always pause offscreen.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!inView) {
      if (!v.paused) v.pause();
      return;
    }
    if (autoplay && !reduced && !userPaused.current) {
      setLoaded(true);
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    }
  }, [inView, autoplay, reduced]);

  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, [wrapRef]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setLoaded(true);
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFs = async () => {
    const el = wrapRef.current;
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (el.requestFullscreen) await el.requestFullscreen();
    else v?.webkitEnterFullscreen?.(); // iOS Safari
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !dur) return;
    v.currentTime = (Number(e.target.value) / 1000) * dur;
  };

  const onKey = (e: React.KeyboardEvent) => {
    const v = videoRef.current;
    if (!v) return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "m") toggleMute();
    else if (e.key === "f") toggleFs();
    else if (e.key === "ArrowRight") v.currentTime = Math.min(dur, v.currentTime + 5);
    else if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
  };

  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className={clsx("group relative w-full overflow-hidden bg-black text-ivory", className)}
      style={aspect && !fs ? { aspectRatio: String(aspect) } : undefined}
      onKeyDown={onKey}
    >
      <video
        ref={videoRef}
        src={loaded ? src : undefined}
        poster={poster}
        playsInline
        muted={muted}
        preload="none"
        className="absolute inset-0 h-full w-full object-contain"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        aria-label={label}
      />
      {!playing && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
          aria-label={`Play: ${label}`}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red text-ivory transition-transform group-hover:scale-105 md:h-24 md:w-24">
            <Play className="ml-1 h-8 w-8" fill="currentColor" />
          </span>
        </button>
      )}
      <div
        className={clsx(
          "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 transition-opacity md:px-5",
          playing ? "opacity-0 focus-within:opacity-100 group-hover:opacity-100" : "opacity-100",
        )}
      >
        <button type="button" onClick={toggle} className="flex h-11 w-11 shrink-0 items-center justify-center" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <span className="t-meta-sm hidden w-[96px] shrink-0 tabular-nums sm:block">
          {fmt(time)} / {fmt(dur)}
        </span>
        <div className="relative h-11 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-ivory/25">
            <div className="h-full bg-red" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(pct * 10)}
            onChange={seek}
            aria-label="Seek"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <button type="button" onClick={toggleMute} className="flex h-11 w-11 shrink-0 items-center justify-center" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button type="button" onClick={toggleFs} className="flex h-11 w-11 shrink-0 items-center justify-center" aria-label={fs ? "Exit fullscreen" : "Fullscreen"}>
          {fs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
      {playing && (
        <div className="t-meta-sm pointer-events-none absolute left-3 top-3 flex items-center gap-2 md:left-5 md:top-5">
          <span className="rec-dot h-2 w-2 rounded-full bg-red" /> {muted ? "Muted" : "Sound on"}
        </div>
      )}
    </div>
  );
}

/** YouTube/Vimeo facade: nothing third-party loads until the user clicks. */
export function EmbedPlayer({ url, label, posterSrc, className }: { url: string; label: string; posterSrc?: string; className?: string }) {
  const parsed = parseEmbed(url);
  const [open, setOpen] = useState(false);
  if (!parsed) {
    return (
      <div className={clsx("flex aspect-video items-center justify-center bg-smoke text-ash", className)}>
        <span className="t-meta">Unsupported video link</span>
      </div>
    );
  }
  const thumb = posterSrc ?? parsed.thumb;
  return (
    <div className={clsx("relative aspect-video w-full overflow-hidden bg-black", className)}>
      {open ? (
        <iframe
          src={parsed.embedUrl}
          title={label}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="group absolute inset-0" aria-label={`Play video: ${label}`}>
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#3a120a,#0b0b0b_70%)]" />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red text-ivory transition-transform group-hover:scale-105">
              <Play className="ml-1 h-8 w-8" fill="currentColor" />
            </span>
          </span>
          <span className="t-meta-sm absolute bottom-3 left-3 text-ivory">{parsed.provider} · click to load</span>
        </button>
      )}
    </div>
  );
}
