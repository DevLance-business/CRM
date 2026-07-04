"use client";

import { useState, useActionState } from "react";
import { motion } from "framer-motion";
import { Mail, Plus, Search, Tag, Copy, Play, Loader2 } from "lucide-react";
import type { EmailTemplate, TemplateCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Field, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/overlay";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createTemplate, type CreateTemplateState } from "@/app/actions/crm";

const categories: (TemplateCategory | "All")[] = [
  "All",
  "Cold Outreach",
  "Follow-up",
  "Meeting Request",
  "Proposal",
  "Thank You",
  "LinkedIn Message",
];

const catTone: Record<TemplateCategory, string> = {
  "Cold Outreach": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Follow-up": "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  "Meeting Request": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "Proposal": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Thank You": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "LinkedIn Message": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

export function TemplatesView({ emailTemplates }: { emailTemplates: EmailTemplate[] }) {
  const [tab, setTab] = useState<TemplateCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const filtered = emailTemplates.filter((t) => {
    if (tab !== "All" && t.category !== tab) return false;
    if (query && !t.name.toLowerCase().includes(query.toLowerCase()) && !t.body.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Library"
        title="Email templates"
        description="Reusable outreach sequences with smart variables — consistent across the whole team."
      >
        <Button onClick={() => setEditOpen(true)}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TemplateCategory | "All")} variant="pill">
          <TabsList className="flex-wrap">
            {categories.map((c) => (
              <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates…" className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover className="group h-full cursor-pointer" onClick={() => setPreview(t)}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid h-11 w-11 place-items-center rounded-[13px] bg-brand-gradient text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", catTone[t.category])}>
                    {t.category}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[15px] font-bold leading-tight">{t.name}</h3>
                {t.subject && (
                  <p className="mt-1.5 text-[12.5px] font-semibold text-[var(--color-secondary-foreground)] line-clamp-1">
                    {t.subject}
                  </p>
                )}
                <p className="mt-2 text-[12.5px] text-[var(--color-muted-foreground)] leading-relaxed line-clamp-3 flex-1">
                  {t.body}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {t.variables.slice(0, 3).map((v) => (
                      <span key={v} className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        <Tag className="h-2.5 w-2.5" />{"{"}{v}{"}"}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--color-muted-foreground)]">
                    {t.usageCount} uses
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <PreviewModal template={preview} onClose={() => setPreview(null)} />
      <EditTemplateModal open={editOpen} setOpen={setEditOpen} />
    </div>
  );
}

function PreviewModal({ template, onClose }: { template: EmailTemplate | null; onClose: () => void }) {
  return (
    <Modal open={!!template} onClose={onClose} size="max-w-xl" label="Template preview">
      {template && (
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-[13px] bg-brand-gradient text-white">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight">{template.name}</h2>
                <span className={cn("inline-block mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", catTone[template.category])}>
                  {template.category}
                </span>
              </div>
            </div>
          </div>

          {template.subject && (
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Subject</p>
              <p className="text-[14px] font-semibold mt-1">{template.subject}</p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Body</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-[14px] border border-[var(--color-border-subtle)] bg-white/50 dark:bg-white/5 p-4 text-[13px] leading-relaxed font-sans">{template.body}</pre>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Variables</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {template.variables.map((v) => (
                <Badge key={v} variant="blue">{"{"}{v}{"}"}</Badge>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Button className="flex-1" onClick={() => toast.success("Template copied to clipboard")}>
              <Copy className="h-4 w-4" /> Copy template
            </Button>
            <Button variant="secondary" onClick={() => toast.success("Preview sent to your inbox")}>
              <Play className="h-4 w-4" /> Send preview
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function EditTemplateModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [state, formAction, pending] = useActionState<CreateTemplateState, FormData>(createTemplate, undefined);

  if (!open && state?.ok) setOpen(false);

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="max-w-lg" label="New template">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-gradient text-white">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">New template</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Use variables like{" "}
            <code className="rounded bg-blue-50 dark:bg-blue-500/10 px-1 text-[11px] text-blue-700 dark:text-blue-300">{"{{company_name}}"}</code>{" "}
            for dynamic personalization.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Template name" required className="col-span-2">
            <Input name="name" required placeholder="Cold Intro — Product Engineering" />
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue="Cold Outreach">
              <option>Cold Outreach</option>
              <option>Follow-up</option>
              <option>Meeting Request</option>
              <option>Proposal</option>
              <option>Thank You</option>
              <option>LinkedIn Message</option>
            </Select>
          </Field>
          <Field label="Subject" required>
            <Input name="subject" required placeholder="Helping {{company_name}} ship faster" />
          </Field>
        </div>
        <Field label="Body" required hint="Variables: {{company_name}}, {{contact_name}}, {{sender_name}}, {{service}}, {{website}}">
          <Textarea name="body" required rows={7} placeholder={"Hi {{contact_name}},\n\nI came across {{company_name}}…"} />
        </Field>

        {state?.error && (
          <p className="rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
            {state.error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create template"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}