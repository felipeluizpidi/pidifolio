import { notFound } from "next/navigation";
import { readContent } from "@/lib/store";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await readContent();
  const project = c.projects.find((p) => p.id === id);
  if (!project) notFound();
  return <ProjectEditor key={project.id} project={project} categories={[...c.categories].sort((a, b) => a.order - b.order)} media={c.media} />;
}
