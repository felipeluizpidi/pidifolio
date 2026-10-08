import { readContent } from "@/lib/store";
import { referenceCounts } from "@/lib/media-refs";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default async function MediaPage() {
  const c = await readContent();
  return <MediaLibrary media={c.media} refs={referenceCounts(c)} />;
}
