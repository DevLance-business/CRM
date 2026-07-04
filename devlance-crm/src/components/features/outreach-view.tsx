"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send, Mail, Clock, CheckCircle2, Hourglass, Paperclip, Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Company, EmailRecord, EmailTemplate, EmailStatus } from "@/lib/types";
import { useUIStore } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, StatusBadge } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Modal } from "@/components/ui/overlay";
import { Input, Select, Textarea, Field } from "@/components/ui/input";
import { logEmail, type LogEmailState } from "@/app/actions/crm";
import { useActionState } from "react";

const statusTone: Record<EmailStatus, { variant: "blue" | "amber" | "green" | "neutral"; icon: LucideIcon }> = {
  Draft: { variant: "neutral", icon: Clock },
  "Waiting for Reply": { variant: "amber", icon: Hourglass },
  Replied: { variant: "green", icon: CheckCircle2 },
  Sent: { variant: "blue", icon: Send },
};

export interface OutreachData {
  companies: Company[];
  emailsByCompany: Record<string, EmailRecord[]>;
  users: Record<string, import("@/lib/types").User>;
  templates: EmailTemplate[];
}

export function OutreachView({ data }: { data: OutreachData }) {
  const { setSelectedCompany } = useUIStore();
  const [logOpen, setLogOpen] = useState(false);

  const active = data.companies.filter((c) => c.status === "Outreach Active" || c.status === "Replied" || c.locked);
  const companiesWithEmails = active
    .map((c) => ({ company: c, emails: data.emailsByCompany[c.id] ?? [] }))
    .sort((a, b) => (b.emails[0]?.sentAt ?? "").localeCompare(a.emails[0]?.sentAt ?? ""));

  const allEmails = Object.values(data.emailsByCompany).flat();
  const stats = [
    { label: "Active Outreach", value: active.length, icon: Send, tone: "blue" },
    { label: "Awaiting Reply", value: allEmails.filter((e) => e.status === "Waiting for Reply").length, icon: Hourglass, tone: "amber" },
    { label: "Replies", value: allEmails.filter((e) => e.status === "Replied").length, icon: CheckCircle2, tone: "green" },
    { label: "Total Logged", value: allEmails.length, icon: Mail, tone: "cyan" },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Outreach" title="Outreach tracking" description="Live log of every email, status, and reply — the chronological truth per company.">
        <Button onClick={() => setLogOpen(true)}><Plus className="h-4 w-4" /> Log Email</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-[18px] p-4">
            <div className="flex items-center justify-between">
              <div className={cn("grid h-9 w-9 place-items-center rounded-[11px]", s.tone === "blue" && "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300", s.tone === "amber" && "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300", s.tone === "green" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", s.tone === "cyan" && "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300")}><s.icon className="h-4 w-4" /></div>
              <p className="font-display text-2xl font-extrabold tabular-nums">{s.value}</p>
            </div>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {companiesWithEmails.length === 0 ? (
        <EmptyState icon={<Send className="h-7 w-7" />} title="No active outreach yet" description="Start outreach from a company to begin logging emails here." />
      ) : (
        <div className="space-y-5">
          {companiesWithEmails.map(({ company, emails }) => (
            <Card key={company.id} hover>
              <CardContent className="p-5">
                <button onClick={() => setSelectedCompany(company.id)} className="group flex w-full items-center gap-3 text-left">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-brand-gradient text-white font-bold">{company.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-[15px] truncate group-hover:text-blue-600 transition-colors">{company.name}</p>
                    <p className="text-[11.5px] text-[var(--color-muted-foreground)] truncate">{company.industry} · {company.country}</p>
                  </div>
                  <StatusBadge status={company.status} />
                </button>

                {emails.length > 0 ? (
                  <div className="mt-4 relative pl-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--color-border-subtle)]">
                    {emails.map((e) => {
                      const sender = data.users[e.senderId];
                      const tone = statusTone[e.status];
                      return (
                        <div key={e.id} className="relative mb-3 last:mb-0">
                          <span className={cn("absolute -left-[15px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-background)]", e.status === "Replied" ? "bg-emerald-500" : e.status === "Waiting for Reply" ? "bg-amber-500" : "bg-blue-500")} />
                          <div className="rounded-[12px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-bold truncate">{e.subject || "(no subject)"}</p>
                              <Badge variant={tone.variant}><tone.icon className="h-3 w-3" /> {e.status}</Badge>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
                              {sender && <Avatar name={sender.name} color={sender.avatarColor} size="xs" />}
                              <span className="font-semibold text-[var(--color-secondary-foreground)]">{sender?.name}</span>
                              <span>·</span><span>{relativeTime(e.sentAt)}</span>
                            </div>
                            {e.attachments.length > 0 && (<div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[11px] font-semibold"><Paperclip className="h-3 w-3" /> {e.attachments.length} attachment(s)</div>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-[12px] text-[var(--color-muted-foreground)]">No emails logged for this company yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LogEmailModal open={logOpen} setOpen={setLogOpen} companies={data.companies} templates={data.templates} />
    </div>
  );
}

function LogEmailModal({ open, setOpen, companies, templates }: { open: boolean; setOpen: (v: boolean) => void; companies: Company[]; templates: EmailTemplate[] }) {
  const [state, formAction, pending] = useActionState<LogEmailState, FormData>(logEmail, undefined);

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="max-w-lg" label="Log email">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-gradient text-white"><Mail className="h-5 w-5" /></div>
        <div>
          <h2 className="font-display text-lg font-bold">Log email</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">Records a new entry in the outreach timeline.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-3.5">
        <Field label="Company">
          <Select name="companyId" defaultValue={companies[0]?.id} required>
            {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </Select>
        </Field>
        <Field label="Email template" hint="Optional — autofills subject and body">
          <Select name="templateId" defaultValue="">
            <option value="">None — write manually</option>
            {templates.map((t) => (<option key={t.id} value={t.id}>{t.name} · {t.category}</option>))}
          </Select>
        </Field>
        <Field label="Subject"><Input name="subject" required placeholder="Re: Helping Northwind Labs ship faster" /></Field>
        <Field label="Body"><Textarea name="body" rows={5} placeholder="Write the email…" /></Field>
        <Field label="Status">
          <Select name="status" defaultValue="Sent">
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Waiting for Reply">Waiting for Reply</option>
            <option value="Replied">Replied</option>
          </Select>
        </Field>
        <Field label="Notes (optional)"><Input name="notes" placeholder="Context about this email…" /></Field>

        {state?.error && (<p className="rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">{state.error}</p>)}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={pending}>{pending ? "Logging…" : <><Send className="h-4 w-4" /> Log email</>}</Button>
        </div>
      </form>
    </Modal>
  );
}