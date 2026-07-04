import { getDocuments } from "@/lib/data";
import { DocumentsView } from "@/components/features/documents-view";

export default async function DocumentsPage() {
  const docs = await getDocuments();

  const userIds = docs.map((d) => d.uploadedBy).filter(Boolean);
  const { prisma } = await import("@/lib/db");
  const { mapUser } = await import("@/lib/data");
  const userRows = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
  const users: Record<string, import("@/lib/types").User> = {};
  for (const u of userRows) users[u.id] = mapUser(u);

  const meta = await prisma.workspaceMeta.findFirst();
  const customCategories = (meta?.customCategories ?? []) as string[];

  return <DocumentsView documents={docs} users={users} customCategories={customCategories} />;
}