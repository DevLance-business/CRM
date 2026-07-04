import { getEmailTemplates } from "@/lib/data";
import { TemplatesView } from "@/components/features/templates-view";

export default async function TemplatesPage() {
  const templates = await getEmailTemplates();
  return <TemplatesView emailTemplates={templates} />;
}