import { getEmailTemplates } from "@/lib/data";
import { prisma } from "@/lib/db";
import { TemplatesView } from "@/components/features/templates-view";

const defaultTemplateCategories = [
  "Cold Outreach",
  "Follow-up",
  "Meeting Request",
  "Proposal",
  "Thank You",
  "LinkedIn Message",
];

export default async function TemplatesPage() {
  const templates = await getEmailTemplates();
  const meta = await prisma.workspaceMeta.findFirst();
  const customCats = (meta?.templateCategories ?? []) as string[];
  const templateCategories = [...new Set([...defaultTemplateCategories, ...customCats])];

  return <TemplatesView emailTemplates={templates} templateCategories={templateCategories} />;
}