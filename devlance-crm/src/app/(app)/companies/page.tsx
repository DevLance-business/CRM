import { getCompanies, getTeamMembers, getUsersByIds, requireUser } from "@/lib/data";
import { CompaniesView } from "@/components/features/companies-view";

export default async function CompaniesPage() {
  const me = await requireUser();
  const companies = await getCompanies();

  // Resolve all users referenced as owners/creators/lockers
  const userIds = companies.flatMap((c) => [c.assignedTo, c.createdBy, c.lockedBy].filter(Boolean) as string[]);
  const users = await getUsersByIds(userIds);

  const teamMembers = me.role === "ADMIN" ? await getTeamMembers() : [];

  return (
    <CompaniesView
      companies={companies}
      users={users}
      teamMembers={teamMembers}
    />
  );
}