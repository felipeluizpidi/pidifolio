import Image from "next/image";
import clsx from "clsx";
import type { MediaAsset } from "@/lib/types";

type Props = {
  asset?: MediaAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** Fallback label when no asset is set (intentional placeholder) */
  emptyLabel?: string;
  ratio?: string;
  position?: string;
};

/** Fills its (positioned) parent. Images go through next/image. */
export function Media({ asset, sizes, priority, className, imgClassName, emptyLabel = "Image", ratio, position }: Props) {
  if (!asset || asset.kind !== "image") {
    return (
      <div
        className={clsx("absolute inset-0 flex items-end justify-between bg-smoke p-3 text-ash", className)}
        aria-hidden
        style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 14px, rgba(244,233,214,.04) 14px 15px)" }}
      >
        <span className="t-meta-sm">{emptyLabel}</span>
        {ratio && <span className="t-meta-sm">{ratio}</span>}
      </div>
    );
  }
  return (
    <div className={clsx("absolute inset-0 overflow-hidden bg-smoke", className)}>
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={clsx("object-cover", imgClassName)}
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}

/** object-position for a project's cover focus */
export const focusPosition = (focus?: "left" | "center" | "right") => (focus === "left" ? "0% 50%" : focus === "right" ? "100% 50%" : undefined);

export function aspectOf(asset?: MediaAsset, fallback = 16 / 9) {
  return asset?.width && asset?.height ? asset.width / asset.height : fallback;
}
