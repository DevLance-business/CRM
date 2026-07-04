"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/data";
import { statusToDb, sourceToDb, emailStatusToDb, templateCategoryToDb, scopeToDb } from "@/lib/data";
import { avatarGradient } from "@/lib/utils";
import type { CompanyStatus, CompanySource, EmailStatus, TemplateCategory } from "@/lib/types";
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
  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = createMemberSchema.safeParse({
    name: s(formData.get("name")),
    email: s(formData.get("email")),
    password: s(formData.get("password")),
    role: s(formData.get("role")),
    title: s(formData.get("title")),
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
  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = addCompanySchema.safeParse({
    name: s(formData.get("name")),
    website: s(formData.get("website")),
    email: s(formData.get("email")),
    industry: s(formData.get("industry")),
    country: s(formData.get("country")),
    source: s(formData.get("source")),
    notes: s(formData.get("notes")),
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
  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = logEmailSchema.safeParse({
    companyId: s(formData.get("companyId")),
    templateId: s(formData.get("templateId")),
    subject: s(formData.get("subject")),
    body: s(formData.get("body")),
    status: s(formData.get("status")),
    notes: s(formData.get("notes")),
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
  textContent: z.string().optional(),
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

  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = uploadDocumentSchema.safeParse({
    name: s(formData.get("name")),
    category: s(formData.get("category")),
    version: s(formData.get("version")),
    tags: s(formData.get("tags")),
    scope: s(formData.get("scope")),
    textContent: s(formData.get("textContent")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid document details" };
  }
  const { name, category, version, tags } = parsed.data;
  const scope = parsed.data.scope === "Private" ? "Private" as const : "Team" as const;
  const textContent = parsed.data.textContent || "";

  const file = formData.get("file") as (File & { arrayBuffer?: () => Promise<ArrayBuffer> }) | null;
  const hasFile = file !== null && typeof file.size === "number" && file.size > 0;
  const hasText = textContent.trim().length > 0;

  if (!hasFile && !hasText) {
    return { error: "Please select a file or enter text content." };
  }

  let base64: string;
  let fileType: string;
  let fileSize: number;

  try {
    if (hasFile && file) {
      if (file.size > 5 * 1024 * 1024) {
        return { error: "File is too large. Maximum size is 5 MB." };
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const buffer = Buffer.from(bytes);
      base64 = buffer.toString("base64");
      fileType = getFileType(file.type);
      fileSize = file.size;
    } else {
      base64 = Buffer.from(textContent.trim(), "utf-8").toString("base64");
      fileType = "text";
      fileSize = new TextEncoder().encode(textContent.trim()).length;
    }
  } catch {
    return { error: "Failed to process file. The file may be corrupted or too large." };
  }

  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const doc = await prisma.documentItem.create({
    data: {
      name,
      category,
      size: formatBytes(fileSize),
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
      meta: { category, version, size: formatBytes(fileSize) },
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
  subject: z.string().optional().or(z.literal("")),
  body: z.string().min(1, "Body is required"),
  scope: z.enum(["Team", "Private"]).default("Team"),
});

export type CreateTemplateState = { error?: string; ok?: boolean } | undefined;

export async function createTemplate(_prev: CreateTemplateState, formData: FormData): Promise<CreateTemplateState> {
  const me = await requireUser();

  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = createTemplateSchema.safeParse({
    name: s(formData.get("name")),
    category: s(formData.get("category")),
    subject: s(formData.get("subject")),
    body: s(formData.get("body")),
    scope: s(formData.get("scope")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid template details" };
  }
  const { name, category, subject, body, scope } = parsed.data;

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
      subject: subject || "",
      body,
      variables,
      usageCount: 0,
      scope: scope === "Private" ? "PRIVATE" : "TEAM",
      createdBy: me.id,
    },
  });

  revalidatePath("/templates");
  return { ok: true };
}

export type DeleteTemplateState = { error?: string; ok?: boolean } | undefined;

export async function deleteTemplate(_prev: DeleteTemplateState, formData: FormData): Promise<DeleteTemplateState> {
  await requireUser();
  const templateId = (formData.get("templateId") ?? "") as string;
  if (!templateId) return { error: "No template specified." };

  const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
  if (!template) return { error: "Template not found." };

  await prisma.emailTemplate.delete({ where: { id: templateId } });

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
  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = updateProfileSchema.safeParse({
    name: s(formData.get("name")),
    title: s(formData.get("title")),
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
  const name = (formData.get("name") ?? "") as string;
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

/* ─────────────────────────────────────────────────────────────
   Team member: update & delete (Admin only)
   ───────────────────────────────────────────────────────────── */

const updateMemberSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["Sales", "Team Member"]),
  title: z.string().optional(),
  password: z.string().optional(),
});

export type UpdateMemberState = { error?: string; ok?: boolean } | undefined;

export async function updateTeamMember(_prev: UpdateMemberState, formData: FormData): Promise<UpdateMemberState> {
  await requireAdmin();
  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = updateMemberSchema.safeParse({
    userId: s(formData.get("userId")),
    name: s(formData.get("name")),
    email: s(formData.get("email")),
    role: s(formData.get("role")),
    title: s(formData.get("title")),
    password: s(formData.get("password")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { userId, name, email, role, title, password } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found." };
  if (target.role === "ADMIN") return { error: "Cannot edit the admin account." };

  const emailConflict = await prisma.user.findFirst({ where: { email, id: { not: userId } } });
  if (emailConflict) return { error: "Another user already uses this email." };

  const data: Record<string, unknown> = {
    name,
    email,
    role: role === "Sales" ? "SALES" : "TEAM_MEMBER",
    title: title || null,
  };

  if (password && password.length >= 8) {
    data.passwordHash = await bcrypt.hash(password, 10);
  } else if (password && password.length > 0) {
    return { error: "Password must be at least 8 characters if provided." };
  }

  await prisma.user.update({ where: { id: userId }, data });

  revalidatePath("/settings");
  revalidatePath("/team");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type DeleteMemberState = { error?: string; ok?: boolean } | undefined;

export async function deleteTeamMember(_prev: DeleteMemberState, formData: FormData): Promise<DeleteMemberState> {
  await requireAdmin();
  const userId = (formData.get("userId") ?? "") as string;
  if (!userId) return { error: "No user specified." };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found." };
  if (target.role === "ADMIN") return { error: "Cannot delete the admin account." };

  await prisma.company.updateMany({
    where: { assignedToId: userId },
    data: { assignedToId: null },
  });

  await prisma.company.updateMany({
    where: { lockedById: userId },
    data: { lockedById: null, locked: false, lockedAt: null },
  });

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/settings");
  revalidatePath("/team");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────
   Custom document categories (Admin only)
   ───────────────────────────────────────────────────────────── */

export type CategoryState = { error?: string; ok?: boolean } | undefined;

export async function addCustomCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const name = ((formData.get("name") ?? "") as string).trim();
  if (!name || name.length < 2) return { error: "Category name must be at least 2 characters." };

  const meta = await prisma.workspaceMeta.findFirst();
  if (!meta) return { error: "Workspace not found." };

  const current = (meta.customCategories ?? []) as string[];
  if (current.includes(name)) return { error: "This category already exists." };

  await prisma.workspaceMeta.update({
    where: { id: meta.id },
    data: { customCategories: [...current, name] },
  });

  revalidatePath("/documents");
  return { ok: true };
}

export async function removeCustomCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const name = ((formData.get("name") ?? "") as string).trim();
  if (!name) return { error: "No category specified." };

  const meta = await prisma.workspaceMeta.findFirst();
  if (!meta) return { error: "Workspace not found." };

  const current = (meta.customCategories ?? []) as string[];
  await prisma.workspaceMeta.update({
    where: { id: meta.id },
    data: { customCategories: current.filter((c) => c !== name) },
  });

  revalidatePath("/documents");
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────
   Template categories (Admin only)
   ───────────────────────────────────────────────────────────── */

export async function addTemplateCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const name = ((formData.get("name") ?? "") as string).trim();
  if (!name || name.length < 2) return { error: "Category name must be at least 2 characters." };

  const meta = await prisma.workspaceMeta.findFirst();
  if (!meta) return { error: "Workspace not found." };

  const current = (meta.templateCategories ?? []) as string[];
  if (current.includes(name)) return { error: "This category already exists." };

  await prisma.workspaceMeta.update({
    where: { id: meta.id },
    data: { templateCategories: [...current, name] },
  });

  revalidatePath("/templates");
  return { ok: true };
}

export async function removeTemplateCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const name = ((formData.get("name") ?? "") as string).trim();
  if (!name) return { error: "No category specified." };

  const meta = await prisma.workspaceMeta.findFirst();
  if (!meta) return { error: "Workspace not found." };

  const current = (meta.templateCategories ?? []) as string[];
  await prisma.workspaceMeta.update({
    where: { id: meta.id },
    data: { templateCategories: current.filter((c) => c !== name) },
  });

  revalidatePath("/templates");
  return { ok: true };
}