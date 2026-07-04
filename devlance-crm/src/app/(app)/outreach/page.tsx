import { prisma } from "@/lib/db";
import { requireUser, mapCompany, mapEmail, mapUser, mapTemplate } from "@/lib/data";
import type { EmailRecord, User } from "@/lib/types";
import { OutreachView, type OutreachData } from "@/components/features/outreach-view";

export default async function OutreachPage() {
  const me = await requireUser();
  const companyWhere = me.role === "ADMIN" ? {} : { assignedToId: me.id };

  const [companies, emails] = await Promise.all([
    prisma.company.findMany({ where: companyWhere, orderBy: { createdAt: "desc" } }),
    prisma.email.findMany({
      where: { company: { assignedToId: me.role === "ADMIN" ? undefined : me.id } },
      orderBy: { sentAt: "desc" },
    }),
  ]);

  const emailsByCompany: Record<string, EmailRecord[]> = {};
  for (const e of emails) {
    const mapped = mapEmail(e);
    (emailsByCompany[e.companyId] ??= []).push(mapped);
  }

  const userIds = new Set<string>();
  for (const c of companies) { if (c.assignedToId) userIds.add(c.assignedToId); if (c.createdById) userIds.add(c.createdById); }
  for (const e of emails) userIds.add(e.senderId);
  const userRows = await prisma.user.findMany({ where: { id: { in: Array.from(userIds) } } });
  const users: Record<string, User> = {};
  for (const u of userRows) users[u.id] = mapUser(u);

  const templates = await prisma.emailTemplate.findMany({
    where: {
      OR: [
        { scope: "TEAM" },
        { createdBy: me.id },
      ],
    },
    orderBy: { usageCount: "desc" },
  });

  const data: OutreachData = {
    companies: companies.map(mapCompany),
    emailsByCompany,
    users,
    templates: templates.map(mapTemplate),
  };

  return <OutreachView data={data} />;
}