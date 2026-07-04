import { requireUser, getUserById } from "@/lib/data";
import { prisma } from "@/lib/db";
import { SettingsView } from "@/components/features/settings-view";
import type { User } from "@/lib/types";

export default async function SettingsPage() {
  const me = await requireUser();
  let members: User[] = [];
  if (me.role === "ADMIN") {
    const { getTeamMembers } = await import("@/lib/data");
    members = await getTeamMembers();
  } else {
    const u = await getUserById(me.id);
    if (u) members = [u];
  }
  const meta = await prisma.workspaceMeta.findFirst();
  const workspaceName = meta?.name ?? "";
  return <SettingsView members={members} currentUserId={me.id} workspaceName={workspaceName} />;
}