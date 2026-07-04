"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users2, Check, Plus, Loader2, Mail, Lock, User,
} from "lucide-react";
import type { User as UserType } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/overlay";
import { toast } from "sonner";
import {
  createTeamMember, type CreateMemberState,
  updateProfile, type UpdateProfileState,
  updateWorkspace, type UpdateWorkspaceState,
} from "@/app/actions/crm";

const settingsTabs = [
  { value: "profile", label: "Profile" },
  { value: "notifications", label: "Notifications" },
  { value: "roles", label: "Roles & access" },
  { value: "workspace", label: "Workspace" },
];

export function SettingsView({ members, currentUserId, workspaceName }: { members: UserType[]; currentUserId: string; workspaceName: string }) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("profile");
  const [addOpen, setAddOpen] = useState(false);
  if (!user) return null;
  const isAdmin = user.role === "Admin";

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Configuration" title="Settings" description="Manage your profile, notifications, team roles, and workspace preferences." />

      <Tabs value={tab} onValueChange={setTab} variant="pill">
        <TabsList className="flex-wrap">
          {settingsTabs.map((t) => (<TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>))}
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How you appear across DevLance CRM.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what DevLance CRM pings you about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <NotifRow label="New replies" description="When a company replies to your outreach" defaultChecked />
              <NotifRow label="Lock taken / released" description="When outreach ownership changes" defaultChecked />
              <NotifRow label="Follow-up reminders" description="Daily digest of due and overdue follow-ups" defaultChecked />
              <NotifRow label="Duplicate prevented" description="When the system blocks a duplicate company" />
              <NotifRow label="Member joined / left" description="Team membership changes" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Roles & access</CardTitle>
                <CardDescription>Role-based access control for the DevLance team.</CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> Add team member
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <RoleCard role="Admin" perms={["Full access", "Manage roles", "Merge records", "Reassign ownership"]} accent="blue" count={members.filter((u) => u.role === "Admin").length} />
                <RoleCard role="Sales" perms={["Own outreach", "Log emails", "Schedule follow-ups", "View all companies"]} accent="violet" count={members.filter((u) => u.role === "Sales").length} />
                <RoleCard role="Team Member" perms={["View assigned", "Log emails", "Read documents"]} accent="neutral" count={members.filter((u) => u.role === "Team Member").length} />
              </div>

              <div className="mt-4 rounded-[14px] border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)] overflow-hidden">
                {members.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3">
                    <Avatar name={u.name} color={u.avatarColor} online={u.online} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold truncate">{u.name}{u.id === currentUserId && " (you)"}</p>
                      <p className="text-[11.5px] text-[var(--color-muted-foreground)] truncate">{u.email}</p>
                    </div>
                    <Badge variant={u.role === "Admin" ? "blue" : u.role === "Sales" ? "violet" : "neutral"}>{u.role}</Badge>
                    {isAdmin && u.id !== currentUserId && (
                      <Button variant="ghost" size="sm" onClick={() => toast(`Editing ${u.name}'s role`)}>Edit</Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="mt-5">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Branding and defaults for DevLance HQ.</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceForm workspaceName={workspaceName} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isAdmin && <AddMemberModal open={addOpen} setOpen={setAddOpen} />}
    </div>
  );
}

function NotifRow({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--color-border-subtle)] p-3.5">
      <div>
        <p className="text-[13px] font-bold">{label}</p>
        <p className="text-[12px] text-[var(--color-muted-foreground)]">{description}</p>
      </div>
      <button onClick={() => setOn((v) => !v)} className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-brand-gradient" : "bg-slate-200 dark:bg-white/15")} role="switch" aria-checked={on}>
        <motion.span layout className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

function ProfileForm({ user }: { user: UserType }) {
  const [state, formAction, pending] = useActionState<UpdateProfileState, FormData>(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} color={user.avatarColor} online={user.online} size="lg" />
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Full name">
          <Input name="name" defaultValue={user.name} required />
        </Field>
        <Field label="Title">
          <Input name="title" defaultValue={user.title} />
        </Field>
        <Field label="Email">
          <Input defaultValue={user.email} disabled />
        </Field>
        <Field label="Role">
          <Select defaultValue={user.role} disabled>
            <option>Admin</option><option>Sales</option><option>Team Member</option>
          </Select>
        </Field>
      </div>
      {state?.ok && (
        <p className="rounded-[10px] border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-[12.5px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-300">
          Profile updated.
        </p>
      )}
      {state?.error && (
        <p className="rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function WorkspaceForm({ workspaceName }: { workspaceName: string }) {
  const [state, formAction, pending] = useActionState<UpdateWorkspaceState, FormData>(updateWorkspace, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Workspace name">
          <Input name="name" defaultValue={workspaceName} required />
        </Field>
        <Field label="Default language">
          <Select defaultValue="en">
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </Select>
        </Field>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold">Accent theme</p>
        <div className="flex gap-2">
          {["#2563eb", "#22d3ee", "#8b5cf6", "#16a34a"].map((c, i) => (
            <button key={c} type="button" className={cn("h-10 w-10 rounded-[12px] border-2 transition-all", i === 0 ? "border-[var(--color-foreground)] scale-105" : "border-transparent")} style={{ background: c }}>
              {i === 0 && <Check className="h-4 w-4 text-white mx-auto" />}
            </button>
          ))}
        </div>
      </div>
      {state?.ok && (
        <p className="rounded-[10px] border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-[12.5px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-300">
          Workspace updated.
        </p>
      )}
      {state?.error && (
        <p className="rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save workspace"}
      </Button>
    </form>
  );
}

function RoleCard({ role, perms, accent, count }: { role: string; perms: string[]; accent: "blue" | "violet" | "neutral"; count: number }) {
  return (
    <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className={cn("grid h-9 w-9 place-items-center rounded-[11px]", accent === "blue" && "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300", accent === "violet" && "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300", accent === "neutral" && "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300")}>
          <ShieldCheck className="h-4 w-4" />
        </div>
        <Badge variant="outline">{count} members</Badge>
      </div>
      <p className="mt-2 font-display font-bold text-[14px]">{role}</p>
      <ul className="mt-2 space-y-1">
        {perms.map((p) => (<li key={p} className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-secondary-foreground)]"><Check className="h-3 w-3 text-emerald-500" /> {p}</li>))}
      </ul>
    </div>
  );
}

function AddMemberModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [state, formAction, pending] = useActionState<CreateMemberState, FormData>(createTeamMember, undefined);

  if (!open && state?.ok) setOpen(false);

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="max-w-lg" label="Add team member">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-gradient text-white"><Users2 className="h-5 w-5" /></div>
        <div>
          <h2 className="font-display text-lg font-bold">Add a team member</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">They&apos;ll sign in with these credentials at the login page.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Full name" className="col-span-2">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input name="name" required className="pl-10" placeholder="Sofia Rinaldi" />
            </div>
          </Field>
          <Field label="Work email" className="col-span-2">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input name="email" type="email" required className="pl-10" placeholder="sofia@devlance.com" />
            </div>
          </Field>
          <Field label="Role">
            <Select name="role" defaultValue="Team Member">
              <option value="Sales">Sales</option>
              <option value="Team Member">Team Member</option>
            </Select>
          </Field>
          <Field label="Job title (optional)">
            <Input name="title" placeholder="Outreach Specialist" />
          </Field>
          <Field label="Password" className="col-span-2">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input name="password" type="password" required minLength={8} className="pl-10" placeholder="At least 8 characters" />
            </div>
            <p className="mt-1.5 text-[11.5px] text-[var(--color-muted-foreground)]">
              Share this password securely with the team member. They&apos;ll use it at <span className="font-semibold">/login</span>.
            </p>
          </Field>
        </div>

        {state?.error && (
          <p className="rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><Plus className="h-4 w-4" /> Add team member</>}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}