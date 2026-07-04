import { getTeamMemberStats, getTeamMembers } from "@/lib/data";
import { TeamView } from "@/components/features/team-view";

export default async function TeamPage() {
  const [teamStats, allUsers] = await Promise.all([getTeamMemberStats(), getTeamMembers()]);
  return <TeamView teamStats={teamStats} allUsers={allUsers} />;
}