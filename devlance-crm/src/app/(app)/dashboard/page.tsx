import { getDashboardStats, getActivities, getCompanies, getTeamMemberStats, requireUser } from "@/lib/data";
import { AdminDashboard } from "@/components/features/admin-dashboard";
import { MemberDashboard } from "@/components/features/member-dashboard";

export default async function DashboardPage() {
  const me = await requireUser();
  const stats = await getDashboardStats();
  const activities = await getActivities({ limit: 12 });
  const companies = await getCompanies();

  if (me.role === "ADMIN") {
    const teamStats = await getTeamMemberStats();
    return (
      <AdminDashboard
        stats={stats}
        activities={activities}
        companies={companies}
        teamStats={teamStats}
        adminName={me.name}
      />
    );
  }

  return (
    <MemberDashboard
      stats={stats}
      activities={activities}
      companies={companies}
      memberName={me.name}
    />
  );
}