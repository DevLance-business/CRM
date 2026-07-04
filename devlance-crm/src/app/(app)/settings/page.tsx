import { getTeamMembers, requireUser } from "@/lib/data";
import { prisma } from "@/lib/db";
import { SettingsView } from "@/components/features/settings-view";

export default async function SettingsPage() {
  const me = await requireUser();
  const members = await getTeamMembers();
  const meta = await prisma.workspaceMeta.findFirst();
  const workspaceName = meta?.name ?? "";
  return <SettingsView members={members} currentUserId={me.id} workspaceName={workspaceName} />;
}