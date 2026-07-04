"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/data";
import { statusToDb, sourceToDb, emailStatusToDb } from "@/lib/data";
import { avatarGradient } from "@/lib/utils";
import type { CompanyStatus, CompanySource, EmailStatus } from "@/lib/types";
import type { ActivityType as DbActivityType } from "@prisma/client";

/* ─────────────────────────────────────────────────────────────
   Team member management (Admin only)
   ───────────────────────────────────────────────────────────── */

const createMemberSchema = z.object({
  name: z.string().min(2, "Enter the member's full name"),
  email: z.string().email("Enter a valid work email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["Sales", "Team Member"]),
  title: z.string().optional(),
});

export type CreateMemberState = { error?: string; ok?: boolean } | undefined;

export async function createTeamMember(_prev: CreateMemberState, formData: FormData): Promise<CreateMemberState> {
  await requireAdmin();
  const parsed = createMemberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { name, email, password, role, title } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role === "Sales" ? "SALES" : "TEAM_MEMBER",
      title: title || null,
      avatarColor: avatarGradient(email),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/team");
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────
   Company: add + assign + change status
   ───────────────────────────────────────────────────────────── */

const addCompanySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  website: z.string().min(3, "Website is required"),
  email: z.string().email().optional().or(z.literal("")),
  industry: z.string().optional(),
  country: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export type AddCompanyState = { error?: string; ok?: boolean; duplicate?: boolean } | undefined;

export async function addCompany(_prev: AddCompanyState, formData: FormData): Promise<AddCompanyState> {
  const me = await requireUser();
  const parsed = addCompanySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website"),
    email: formData.get("email"),
    industry: formData.get("industry"),
    country: formData.get("country"),
    source: formData.get("source"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { name, website, email, industry, country, source, notes } = parsed.data;

  // Duplicate detection
  const domain = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  const emailDomain = email ? email.split("@")[1]?.toLowerCase() : "";
  const existing = await prisma.company.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        { website: { contains: domain, mode: "insensitive" } },
        ...(emailDomain ? [{ contactEmails: { has: email } }] : []),
      ],
    },
  });
  if (existing) return { duplicate: true, error: "duplicate" };

  const company = await prisma.company.create({
    data: {
      name,
      website,
      industry: industry || null,
      country: country || null,
      contactEmails: email ? [email] : [],
      source: source ? sourceToDb(source as CompanySource) : "COLD_LIST",
      notes: notes || null,
      createdById: me.id,
      assignedToId: me.role === "ADMIN" ? null : me.id,
      status: "NOT_CONTACTED",
    },
  });

  await prisma.activity.create({
    data: {
      type: "COMPANY_ADDED" as DbActivityType,
      actorId: me.id,
      companyId: company.id,
      message: `added ${company.name} to the CRM`,
      meta: { source: source || "—" },
    },
  });

  revalidatePath("/companies");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function assignCompany(companyId: string, userId: string): Promise<void> {
  const me = await requireUser();
  if (me.role !== "ADMIN") throw new Error("Admin only");
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { assignedToId: userId || null },
  });
  const target = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  await prisma.activity.create({
    data: {
      type: "COMPANY_ASSIGNED" as DbActivityType,
      actorId: me.id,
      companyId,
      message: target ? `assigned ${company.name} to ${target.name}` : `unassigned ${company.name}`,
    },
  });
  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

export async function updateCompanyStatus(companyId: string, status: CompanyStatus): Promise<void> {
  const me = await requireUser();
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { status: statusToDb(status) },
  });
  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGED" as DbActivityType,
      actorId: me.id,
      companyId,
      message: `moved ${company.name} to ${status}`,
    },
  });
  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

/* ─────────────────────────────────────────────────────────────
   Outreach lock system
   ───────────────────────────────────────────────────────────── */

export async function startOutreach(companyId: string): Promise<void> {
  const me = await requireUser();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");
  if (company.locked && company.lockedById && company.lockedById !== me.id) {
    throw new Error("Company is locked by another user");
  }
  await prisma.company.update({
    where: { id: companyId },
    data: {
      locked: true,
      lockedById: me.id,
      lockedAt: new Date(),
      status: company.status === "NOT_CONTACTED" ? "OUTREACH_ACTIVE" : company.status,
      assignedToId: company.assignedToId ?? me.id,
    },
  });
  await prisma.activity.create({
    data: {
      type: "OUTREACH_STARTED" as DbActivityType,
      actorId: me.id,
      companyId,
      message: `locked ${company.name} for outreach`,
    },
  });
  revalidatePath("/companies");
  revalidatePath("/outreach");
  revalidatePath("/dashboard");
}

export async function releaseOutreach(companyId: string): Promise<void> {
  const me = await requireUser();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");
  if (company.lockedById !== me.id && me.role !== "ADMIN") {
    throw new Error("Only the lock owner or an admin can release");
  }
  await prisma.company.update({
    where: { id: companyId },
    data: { locked: false, lockedById: null, lockedAt: null },
  });
  await prisma.activity.create({
    data: {
      type: "OUTREACH_RELEASED" as DbActivityType,
      actorId: me.id,
      companyId,
      message: `released ${company.name}`,
    },
  });
  revalidatePath("/companies");
  revalidatePath("/outreach");
  revalidatePath("/dashboard");
}

/* ─────────────────────────────────────────────────────────────
   Log email
   ───────────────────────────────────────────────────────────── */

const logEmailSchema = z.object({
  companyId: z.string().min(1, "Select a company"),
  templateId: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

export type LogEmailState = { error?: string; ok?: boolean } | undefined;

export async function logEmail(_prev: LogEmailState, formData: FormData): Promise<LogEmailState> {
  const me = await requireUser();
  const parsed = logEmailSchema.safeParse({
    companyId: formData.get("companyId"),
    templateId: formData.get("templateId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const { companyId, templateId, subject, body, notes } = parsed.data;
  const status = emailStatusToDb(parsed.data.status as EmailStatus);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Company not found" };
  if (me.role !== "ADMIN" && company.assignedToId !== me.id) {
    return { error: "You can only log emails for companies assigned to you" };
  }

  await prisma.email.create({
    data: {
      companyId,
      subject,
      templateId: templateId || null,
      senderId: me.id,
      body: body || "",
      status,
      notes: notes || null,
      attachments: [],
    },
  });

  await prisma.company.update({
    where: { id: companyId },
    data: {
      lastOutreachAt: new Date(),
      followUpCount: { increment: 1 },
      status: status === "REPLIED" ? "REPLIED" : company.status === "NOT_CONTACTED" ? "OUTREACH_ACTIVE" : company.status,
    },
  });

  await prisma.activity.create({
    data: {
      type: "EMAIL_SENT" as DbActivityType,
      actorId: me.id,
      companyId,
      message: `sent "${subject}" to ${company.name}`,
      meta: { subject },
    },
  });
  if (status === "REPLIED") {
    await prisma.activity.create({
      data: {
        type: "REPLY_RECEIVED" as DbActivityType,
        actorId: me.id,
        companyId,
        message: `received a reply from ${company.name}`,
      },
    });
  }

  revalidatePath("/outreach");
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { ok: true };
}