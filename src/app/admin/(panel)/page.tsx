import { readContent } from "@/lib/store";
import { ProjectsBoard } from "@/components/admin/ProjectsBoard";
import { createProject } from "../actions";

export default async function AdminHome() {
  const c = await readContent();
  const rows = [...c.projects]
    .sort((a, b) => a.order - b.order)
    .map(({ id, slug, title, subtitle, year, published, featured, featuredLayout, demo, coverId }) => ({ id, slug, title, subtitle, year, published, featured, featuredLayout, demo, coverId }));
  return (
    <ProjectsBoard
      projects={rows}
      featuredOrder={c.settings.selectedWork.featuredOrder}
      media={Object.fromEntries(c.media.map((m) => [m.id, m]))}
      createAction={createProject}
    />
  );
}
