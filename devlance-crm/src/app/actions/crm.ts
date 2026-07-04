"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/data";
import { statusToDb, sourceToDb, emailStatusToDb, templateCategoryToDb, documentCategoryToDb, scopeToDb } from "@/lib/data";
import { avatarGradient } from "@/lib/utils";
import type { CompanyStatus, CompanySource, EmailStatus, TemplateCategory, DocumentCategory } from "@/lib/types";
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
  website: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").min(1, "Email is required"),
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

  const websiteClean = website || "";

  // Duplicate detection
  const domain = websiteClean ? websiteClean.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase() : "";
  const emailDomain = email ? email.split("@")[1]?.toLowerCase() : "";
  const existing = await prisma.company.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: "insensitive" as const } },
        ...(domain ? [{ website: { contains: domain, mode: "insensitive" as const } }] : []),
        ...(emailDomain ? [{ contactEmails: { has: email } }] : []),
      ],
    },
  });
  if (existing) return { duplicate: true, error: "duplicate" };

  const company = await prisma.company.create({
    data: {
      name,
      website: websiteClean,
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

/* ─────────────────────────────────────────────────────────────
   Document upload
   ───────────────────────────────────────────────────────────── */

const uploadDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  category: z.string().min(1, "Category is required"),
  version: z.string().min(1, "Version is required"),
  tags: z.string().optional(),
  scope: z.enum(["Team", "Private"]).default("Team"),
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(mime: string): string {
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("xlsx")) return "xlsx";
  if (mime.includes("presentation") || mime.includes("powerpoint") || mime.includes("pptx")) return "pptx";
  if (mime.includes("word") || mime.includes("document") || mime.includes("docx")) return "docx";
  if (mime.includes("image")) return "image";
  return "pdf";
}

export type UploadDocumentState = { error?: string; ok?: boolean } | undefined;

export async function uploadDocument(_prev: UploadDocumentState, formData: FormData): Promise<UploadDocumentState> {
  const me = await requireUser();

  const parsed = uploadDocumentSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    version: formData.get("version"),
    tags: formData.get("tags"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid document details" };
  }
  const { name, category, version, tags } = parsed.data;
  const scope = parsed.data.scope === "Private" ? "Private" as const : "Team" as const;

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Please select a file to upload." };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File is too large. Maximum size is 10 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const fileType = getFileType(file.type);
  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const doc = await prisma.documentItem.create({
    data: {
      name,
      category: documentCategoryToDb(category as DocumentCategory),
      size: formatBytes(file.size),
      type: fileType,
      version,
      tags: tagList,
      url: "",
      base64,
      uploadedById: me.id,
      scope: scopeToDb(scope),
    },
  });

  await prisma.activity.create({
    data: {
      type: "DOCUMENT_UPLOADED" as DbActivityType,
      actorId: me.id,
      companyId: null,
      message: `uploaded document "${doc.name}"`,
      meta: { category, version, size: formatBytes(file.size) },
    },
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────
   Email template management
   ───────────────────────────────────────────────────────────── */

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.string().min(1, "Category is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type CreateTemplateState = { error?: string; ok?: boolean } | undefined;

export async function createTemplate(_prev: CreateTemplateState, formData: FormData): Promise<CreateTemplateState> {
  await requireUser();

  const parsed = createTemplateSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid template details" };
  }
  const { name, category, subject, body } = parsed.data;

  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = variableRegex.exec(body)) !== null) {
    if (!variables.includes(match[1])) variables.push(match[1]);
  }

  await prisma.emailTemplate.create({
    data: {
      name,
      category: templateCategoryToDb(category as TemplateCategory),
      subject,
      body,
      variables,
      usageCount: 0,
    },
  });

  revalidatePath("/templates");
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────
   Profile & workspace updates
   ───────────────────────────────────────────────────────────── */

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  title: z.string().optional(),
});

export type UpdateProfileState = { error?: string; ok?: boolean } | undefined;

export async function updateProfile(_prev: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
  const me = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { name, title } = parsed.data;

  await prisma.user.update({
    where: { id: me.id },
    data: { name, title: title || null },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export type UpdateWorkspaceState = { error?: string; ok?: boolean } | undefined;

export async function updateWorkspace(_prev: UpdateWorkspaceState, formData: FormData): Promise<UpdateWorkspaceState> {
  await requireAdmin();
  const name = formData.get("name") as string;
  if (!name || name.trim().length < 2) {
    return { error: "Workspace name must be at least 2 characters" };
  }

  const existing = await prisma.workspaceMeta.findFirst();
  if (existing) {
    await prisma.workspaceMeta.update({ where: { id: existing.id }, data: { name: name.trim() } });
  } else {
    await prisma.workspaceMeta.create({
      data: { name: name.trim(), website: "", adminEmail: "", initialized: true },
    });
  }

  revalidatePath("/settings");
  return { ok: true };
}