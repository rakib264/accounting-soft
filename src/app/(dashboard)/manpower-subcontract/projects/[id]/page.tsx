import { ProjectDetailPage } from "@/components/business/project-detail-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDetailPage projectId={id} />;
}
