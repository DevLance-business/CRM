import "server-only";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import type { Role, CompanyStatus, CompanySource, EmailStatus, ActivityType } from "@/lib/types";
import type { Company, EmailRecord, Activity, EmailTemplate, DocumentItem, User, DashboardData, KpiPoint } from "@/lib/types";
import type {
  CompanyStatus as DbCompanyStatus,
  CompanySource as DbCompanySource,
  EmailStatus as DbEmailStatus,
  ActivityType as DbActivityType,
  Role as DbRole,
  Visibility as DbVisibility,
} from "@prisma/client";

/* ─────────────────────────────────────────────────────────────
   Enum mappers (Prisma stored as SCREAMING_SNAKE; UI uses Title Case)
   ───────────────────────────────────────────────────────────── */

export const statusFromDb = (s: DbCompanyStatus): CompanyStatus =>
  s === "NOT_CONTACTED" ? "Not Contacted"
    : s === "OUTREACH_ACTIVE" ? "Outreach Active"
    : s === "MEETING_SCHEDULED" ? "Meeting Scheduled"
    : s === "PROPOSAL_SENT" ? "Proposal Sent"
    : s === "CLOSED_WON" ? "Closed Won"
    : s === "CLOSED_LOST" ? "Closed Lost"
    : s === "ON_HOLD" ? "On Hold"
    : "Replied";

export const statusToDb = (s: CompanyStatus): DbCompanyStatus =>
  (s === "Not Contacted" ? "NOT_CONTACTED" : s === "Outreach Active" ? "OUTREACH_ACTIVE" : s.toUpperCase().replace(/ /g, "_")) as DbCompanyStatus;

export const sourceFromDb = (s: DbCompanySource): CompanySource => {
  if (s === "LINKEDIN") return "LinkedIn";
  if (s === "UPWORK") return "Upwork";
  if (s === "CLUTCH") return "Clutch";
  return (s.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase())) as CompanySource;
};

export const sourceToDb = (s: CompanySource): DbCompanySource =>
  s.toUpperCase().replace(/ /g, "_") as DbCompanySource;

export const emailStatusFromDb = (s: DbEmailStatus): EmailStatus =>
  s === "WAITING_FOR_REPLY" ? "Waiting for Reply" : (s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ")) as EmailStatus;

export const emailStatusToDb = (s: EmailStatus): DbEmailStatus =>
  (s === "Waiting for Reply" ? "WAITING_FOR_REPLY" : s.toUpperCase().replace(/ /g, "_")) as DbEmailStatus;

export const activityTypeFromDb = (s: DbActivityType): ActivityType =>
  s.toLowerCase() as ActivityType;

export const activityTypeToDb = (s: ActivityType): DbActivityType =>
  s.toUpperCase() as DbActivityType;

export const templateCategoryFromDb = (s: string): string => s;

export const templateCategoryToDb = (s: string): string => s;

export const roleFromDb = (r: DbRole): Role =>
  r === "ADMIN" ? "Admin" : r === "SALES" ? "Sales" : "Team Member";

export const roleToDb = (r: Role): DbRole =>
  (r === "Admin" ? "ADMIN" : r === "Sales" ? "SALES" : "TEAM_MEMBER") as DbRole;

export const scopeToDb = (s: "Team" | "Private"): DbVisibility =>
  s === "Private" ? "PRIVATE" : "TEAM";

/* ─────────────────────────────────────────────────────────────
   Mappers: DB row → UI shape
   ───────────────────────────────────────────────────────────── */

type DbUser = Awaited<ReturnType<typeof prisma.user.findFirst>>;
export function mapUser(u: NonNullable<DbUser>): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: roleFromDb(u.role),
    title: u.title ?? "",
    avatarColor: u.avatarColor,
    online: u.online,
  };
}

type DbCompany = Awaited<ReturnType<typeof prisma.company.findFirst>>;
export function mapCompany(c: NonNullable<DbCompany>): Company {
  return {
    id: c.id,
    name: c.name,
    website: c.website,
    industry: c.industry ?? "",
    country: c.country ?? "",
    linkedin: c.linkedin ?? "",
    emails: c.contactEmails,
    phone: c.phone ?? "",
    companySize: c.companySize ?? "",
    source: sourceFromDb(c.source),
    notes: c.notes ?? "",
    createdBy: c.createdById,
    assignedTo: c.assignedToId,
    status: statusFromDb(c.status),
    createdAt: c.createdAt.toISOString(),
    locked: c.locked,
    lockedBy: c.lockedById,
    lockedAt: c.lockedAt?.toISOString() ?? null,
    lastOutreachAt: c.lastOutreachAt?.toISOString() ?? null,
    nextFollowUpAt: c.nextFollowUpAt?.toISOString() ?? null,
    followUpCount: c.followUpCount,
    responseRate: c.responseRate,
  };
}

type DbEmail = Awaited<ReturnType<typeof prisma.email.findFirst>>;
export function mapEmail(e: NonNullable<DbEmail>): EmailRecord {
  return {
    id: e.id,
    companyId: e.companyId,
    subject: e.subject,
    templateId: e.templateId,
    senderId: e.senderId,
    body: e.body,
    sentAt: e.sentAt.toISOString(),
    status: emailStatusFromDb(e.status),
    notes: e.notes ?? "",
    attachments: e.attachments,
  };
}

type DbActivity = Awaited<ReturnType<typeof prisma.activity.findFirst>>;
export function mapActivity(a: NonNullable<DbActivity>, actor?: { name: string; avatarColor: string }): Activity {
  return {
    id: a.id,
    type: activityTypeFromDb(a.type),
    actorId: a.actorId,
    actorName: actor?.name,
    actorAvatarColor: actor?.avatarColor,
    companyId: a.companyId,
    createdAt: a.createdAt.toISOString(),
    message: a.message,
    meta: (a.meta as Record<string, string> | null) ?? undefined,
  };
}

type DbTemplate = Awaited<ReturnType<typeof prisma.emailTemplate.findFirst>>;
export function mapTemplate(t: NonNullable<DbTemplate>): EmailTemplate {
  return {
    id: t.id,
    name: t.name,
    category: templateCategoryFromDb(t.category),
    subject: t.subject,
    body: t.body,
    variables: t.variables,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    usageCount: t.usageCount,
    scope: t.scope === "PRIVATE" ? "Private" : "Team",
    createdBy: t.createdBy ?? "",
  };
}

type DbDoc = Awaited<ReturnType<typeof prisma.documentItem.findFirst>>;
export function mapDocument(d: NonNullable<DbDoc>): DocumentItem {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    size: d.size,
    type: d.type as DocumentItem["type"],
    uploadedBy: d.uploadedById ?? "",
    uploadedAt: d.uploadedAt.toISOString(),
    version: d.version,
    tags: d.tags,
    url: d.url,
    scope: d.scope === "PRIVATE" ? "Private" : "Team",
  };
}

/* ─────────────────────────────────────────────────────────────
   Auth helpers (role-aware)
   ───────────────────────────────────────────────────────────── */

async function getCurrentDbUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireUser() {
  const u = await getCurrentDbUser();
  if (!u) throw new Error("Not authenticated");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new Error("Admin only");
  return u;
}

/* ─────────────────────────────────────────────────────────────
   Data access — all role-scoped
   ───────────────────────────────────────────────────────────── */

export async function getTeamMembers(): Promise<User[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(mapUser);
}

export async function getCompanies(): Promise<Company[]> {
  const me = await requireUser();
  const where = me.role === "ADMIN" ? {} : { assignedToId: me.id };
  const rows = await prisma.company.findMany({ where, orderBy: { createdAt: "desc" } });
  return rows.map(mapCompany);
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const me = await requireUser();
  const row = await prisma.company.findUnique({ where: { id } });
  if (!row) return null;
  if (me.role !== "ADMIN" && row.assignedToId !== me.id) return null;
  return mapCompany(row);
}

export async function getEmailsByCompany(companyId: string): Promise<EmailRecord[]> {
  const me = await requireUser();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return [];
  if (me.role !== "ADMIN" && company.assignedToId !== me.id) return [];
  const rows = await prisma.email.findMany({ where: { companyId }, orderBy: { sentAt: "desc" } });
  return rows.map(mapEmail);
}

export async function getActivities(opts?: { actorId?: string; limit?: number }): Promise<Activity[]> {
  const me = await requireUser();
  const where: { actorId?: string } = me.role === "ADMIN" ? {} : { actorId: me.id };
  if (opts?.actorId) where.actorId = opts.actorId;
  const rows = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
    include: { actor: { select: { name: true, avatarColor: true } } },
  });
  return rows.map((a) => mapActivity(a, a.actor ?? undefined));
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const me = await requireUser();
  const rows = await prisma.emailTemplate.findMany({
    where: {
      OR: [
        { scope: "TEAM" },
        { createdBy: me.id },
      ],
    },
    orderBy: { usageCount: "desc" },
  });
  return rows.map(mapTemplate);
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const me = await requireUser();
  // Team-scoped docs visible to everyone. Private docs visible only to uploader.
  const rows = await prisma.documentItem.findMany({
    where: {
      OR: [
        { scope: "TEAM" },
        { uploadedById: me.id },
      ],
    },
    orderBy: { uploadedAt: "desc" },
  });
  return rows.map(mapDocument);
}

export async function getUserById(id: string): Promise<User | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? mapUser(u) : null;
}

// Batch-resolve users by id — used to hydrate client components with owner/creator lookups.
export async function getUsersByIds(ids: string[]): Promise<Record<string, User>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return {};
  const rows = await prisma.user.findMany({ where: { id: { in: unique } } });
  const map: Record<string, User> = {};
  for (const u of rows) map[u.id] = mapUser(u);
  return map;
}

export interface CommandPaletteResult {
  companies: Company[];
  users: User[];
  templates: EmailTemplate[];
}

export async function searchCommand(query: string): Promise<CommandPaletteResult> {
  await requireUser();
  const q = query.trim();
  if (!q) return { companies: [], users: [], templates: [] };

  const [companyRows, userRows, templateRows] = await Promise.all([
    prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { website: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
          { contactEmails: { hasSome: [q] } },
        ],
      },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 3,
    }),
    prisma.emailTemplate.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 3,
    }),
  ]);

  return {
    companies: companyRows.map(mapCompany),
    users: userRows.map(mapUser),
    templates: templateRows.map(mapTemplate),
  };
}

export interface CompanyDetails {
  company: Company;
  emails: EmailRecord[];
  users: Record<string, User>;
}

// Single-bundle fetch for the company drawer — company + emails + all referenced users.
export async function getCompanyDetails(id: string): Promise<CompanyDetails | null> {
  const me = await requireUser();
  const row = await prisma.company.findUnique({ where: { id } });
  if (!row) return null;
  if (me.role !== "ADMIN" && row.assignedToId !== me.id) return null;

  const company = mapCompany(row);
  const [emailRows, userRows] = await Promise.all([
    prisma.email.findMany({ where: { companyId: id }, orderBy: { sentAt: "desc" } }),
    prisma.user.findMany({
      where: { id: { in: [row.assignedToId, row.createdById, row.lockedById].filter(Boolean) as string[] } },
    }),
  ]);
  const emails = emailRows.map(mapEmail);

  // Also include senders from emails
  const senderIds = emailRows.map((e) => e.senderId).filter((sid) => !userRows.some((u) => u.id === sid));
  if (senderIds.length) {
    const senders = await prisma.user.findMany({ where: { id: { in: senderIds } } });
    userRows.push(...senders);
  }

  const users: Record<string, User> = {};
  for (const u of userRows) users[u.id] = mapUser(u);
  return { company, emails, users };
}

export async function getTemplateById(id: string): Promise<EmailTemplate | null> {
  const t = await prisma.emailTemplate.findUnique({ where: { id } });
  return t ? mapTemplate(t) : null;
}

/* ─────────────────────────────────────────────────────────────
   Dashboard stats — role-aware
   ───────────────────────────────────────────────────────────── */

export async function getDashboardStats(): Promise<DashboardData & { weeklyActivity: KpiPoint[] }> {
  const me = await requireUser();
  const adminScope = me.role === "ADMIN";

  const companyWhere = adminScope ? {} : { assignedToId: me.id };
  const emailWhere = adminScope ? {} : { senderId: me.id };

  const [
    totalCompanies,
    companiesAssigned,
    emailsToday,
    replies,
    followUpsDue,
    meetings,
    activeOutreach,
    allCompanies,
  ] = await Promise.all([
    prisma.company.count({ where: companyWhere }),
    prisma.company.count({ where: { ...companyWhere, assignedToId: { not: null } } }),
    prisma.email.count({ where: { ...emailWhere, sentAt: { gte: startOfToday() } } }),
    prisma.email.count({ where: { ...emailWhere, status: "REPLIED" } }),
    prisma.company.count({ where: { ...companyWhere, nextFollowUpAt: { lte: new Date() } } }),
    prisma.company.count({ where: { ...companyWhere, status: "MEETING_SCHEDULED" } }),
    prisma.company.count({ where: { ...companyWhere, status: { in: ["OUTREACH_ACTIVE", "REPLIED"] } } }),
    prisma.company.findMany({ where: companyWhere, select: { responseRate: true } }),
  ]);

  const responseRate = allCompanies.length
    ? Math.round(allCompanies.reduce((s, c) => s + c.responseRate, 0) / allCompanies.length)
    : 0;

  // Build weekly activity (last 7 days) — emails sent per day
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const weekEmails = await prisma.email.findMany({
    where: { ...emailWhere, sentAt: { gte: weekAgo } },
    select: { sentAt: true, status: true },
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyActivity: KpiPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const daysEmails = weekEmails.filter((e) => e.sentAt >= d && e.sentAt < next);
    weeklyActivity.push({
      day: dayNames[d.getDay()],
      sent: daysEmails.length,
      replies: daysEmails.filter((e) => e.status === "REPLIED").length,
    });
  }

  return {
    totalCompanies,
    companiesAssigned,
    emailsSentToday: emailsToday,
    repliesReceived: replies,
    followUpsDue,
    meetingsScheduled: meetings,
    activeOutreach,
    responseRate,
    weeklyActivity,
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ─────────────────────────────────────────────────────────────
   Team performance (admin only)
   ───────────────────────────────────────────────────────────── */

export interface TeamMemberStats {
  user: User;
  assigned: number;
  emailsSent: number;
  pendingReplies: number;
  followUps: number;
  meetings: number;
  won: number;
  avgResponse: number;
  lastActivityAt: string | null;
}

export async function getTeamMemberStats(): Promise<TeamMemberStats[]> {
  await requireAdmin();
  const members = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  const stats: TeamMemberStats[] = [];
  for (const m of members) {
    const [assigned, emails, pending, followUps, meetings, won] = await Promise.all([
      prisma.company.count({ where: { assignedToId: m.id } }),
      prisma.email.count({ where: { senderId: m.id } }),
      prisma.email.count({ where: { senderId: m.id, status: "WAITING_FOR_REPLY" } }),
      prisma.company.count({ where: { assignedToId: m.id, nextFollowUpAt: { not: null } } }),
      prisma.company.count({ where: { assignedToId: m.id, status: "MEETING_SCHEDULED" } }),
      prisma.company.count({ where: { assignedToId: m.id, status: "CLOSED_WON" } }),
    ]);
    const assignedCompanies = await prisma.company.findMany({ where: { assignedToId: m.id }, select: { responseRate: true } });
    const avgResponse = assignedCompanies.length
      ? Math.round(assignedCompanies.reduce((s, c) => s + c.responseRate, 0) / assignedCompanies.length)
      : 0;
    const lastActivity = await prisma.activity.findFirst({ where: { actorId: m.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    stats.push({
      user: mapUser(m),
      assigned,
      emailsSent: emails,
      pendingReplies: pending,
      followUps,
      meetings,
      won,
      avgResponse,
      lastActivityAt: lastActivity?.createdAt.toISOString() ?? null,
    });
  }
  return stats;
}