import { redirect } from "next/navigation";
import { getTeamMemberStats, getTeamMembers, requireUser } from "@/lib/data";
import { TeamView } from "@/components/features/team-view";

export default async function TeamPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") {
    redirect("/dashboard");
  }
  const [teamStats, allUsers] = await Promise.all([getTeamMemberStats(), getTeamMembers()]);
  return <TeamView teamStats={teamStats} allUsers={allUsers} />;
}