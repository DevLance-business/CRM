"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSession,
  clearSession,
  getSessionUserId,
} from "@/lib/auth";
import { avatarGradient } from "@/lib/utils";
import type { Role } from "@/lib/types";

const signupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid work email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspace: z.string().min(2, "Workspace name is required"),
});

export type SignupState = { error?: string; ok?: boolean } | undefined;

export async function signupAdmin(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = signupSchema.safeParse({
    name: s(formData.get("name")),
    email: s(formData.get("email")),
    password: s(formData.get("password")),
    workspace: s(formData.get("workspace")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { name, email, password, workspace } = parsed.data;

  // Enforce one Admin per workspace.
  const existingAdmin = await prisma.workspaceMeta.findFirst();
  if (existingAdmin) {
    return {
      error:
        "A workspace admin already exists for DevLance CRM. Only one Admin can self-register — ask the admin to create your account instead.",
    };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      avatarColor: avatarGradient(email),
      online: true,
    },
  });
  await prisma.workspaceMeta.create({
    data: { name: workspace, adminEmail: email },
  });

  await createSession(admin.id);
  revalidatePath("/");
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email").toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

export type LoginState = { error?: string; ok?: boolean } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const s = (v: FormDataEntryValue | null) => (v === null ? "" : String(v));
  const parsed = loginSchema.safeParse({
    email: s(formData.get("email")),
    password: s(formData.get("password")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No DevLance account found for this email." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Incorrect password. Please try again." };

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), online: true },
  });

  await createSession(user.id);
  revalidatePath("/");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const userId = await getSessionUserId();
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { online: false } }).catch(() => {});
  }
  await clearSession();
  revalidatePath("/");
  redirect("/login");
}

// Public shape of a user that's safe to pass to client components.
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string | null;
  avatarColor: string;
  online: boolean;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: prismaRoleToUi(u.role),
    title: u.title,
    avatarColor: u.avatarColor,
    online: u.online,
  };
}

function prismaRoleToUi(r: "ADMIN" | "SALES" | "TEAM_MEMBER"): Role {
  switch (r) {
    case "ADMIN": return "Admin";
    case "SALES": return "Sales";
    case "TEAM_MEMBER": return "Team Member";
  }
}