"use client";

import { useState, startTransition } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Loader2, Trash2, FileText,
  EyeOff, Copy, Check, Settings2, Mail, Download,
} from "lucide-react";
import type { EmailTemplate } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Field, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/states";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createTemplate, deleteTemplate,
  addTemplateCategory, removeTemplateCategory,
} from "@/app/actions/crm";

const catTones: Record<string, string> = {
  "Cold Outreach": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Follow-up": "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  "Meeting Request": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "Proposal": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Thank You": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "LinkedIn Message": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

function catTone(cat: string) {
  return catTones[cat] ?? "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
}

export function TemplatesView({ emailTemplates, templateCategories }: { emailTemplates: EmailTemplate[]; templateCategories: string[] }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "Admin";
  const allCategories = [...new Set(templateCategories)];
  const [tab, setTab] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  const filtered = emailTemplates.filter((t) => {
    if (tab !== "All" && t.category !== tab) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Library" title="Templates" description="Create reusable message templates for any platform — email, WhatsApp, LinkedIn, and more.">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="secondary" size="sm" onClick={() => setCatOpen(true)}>
              <Settings2 className="h-4 w-4" /> Categories
            </Button>
          )}
          <Button size="sm" onClick={() => setEditorOpen(true)}>
            <Plus className="h-4 w-4" /> New template
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab} variant="pill">
          <TabsList className="flex-wrap">
            <TabsTrigger value="All">All</TabsTrigger>
            {allCategories.map((c) => (<TabsTrigger key={c} value={c}>{c}</TabsTrigger>))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates…" className="pl-10" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Template list */}
        <div>
          {filtered.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title="No templates" description="Create one with the editor." />
          ) : (
            <div className="space-y-3">
              {filtered.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card hover className="group cursor-pointer" onClick={() => setPreview(t)}>
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-display text-[13px] font-bold leading-tight truncate">{t.name}</h3>
                            {t.scope === "Private" && <EyeOff className="h-3 w-3 text-amber-500 shrink-0" />}
                          </div>
                          {t.subject && <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)] truncate">{t.subject}</p>}
                          <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)] line-clamp-2">{t.body}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-rose-500" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", catTone(t.category))}>
                          {t.category}
                        </span>
                        {t.variables.slice(0, 3).map((v) => (
                          <span key={v} className="rounded-md bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-300">
                            {"{"}{v}{"}"}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && <DeleteTemplateModal template={deleteTarget} onClose={() => setDeleteTarget(null)} />}
      {isAdmin && <CategoryModal open={catOpen} setOpen={setCatOpen} categories={templateCategories} />}
      {editorOpen && (
        <TemplateEditor
          templateCategories={allCategories}
          isAdmin={isAdmin}
          onClose={() => setEditorOpen(false)}
        />
      )}
      {preview && <TemplatePreview template={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function TemplateEditor({ templateCategories, isAdmin, onClose }: { templateCategories: string[]; isAdmin: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(templateCategories[0] ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<"Team" | "Private">("Team");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [copied, setCopied] = useState(false);

  const detectedVars = (() => {
    const re = /\{\{(\w+)\}\}/g;
    const vars: string[] = [];
    let m;
    while ((m = re.exec(body)) !== null) {
      if (!vars.includes(m[1])) vars.push(m[1]);
    }
    return vars;
  })();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!category) { setError("Category is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }

    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("category", category);
    fd.set("subject", subject.trim());
    fd.set("body", body.trim());
    fd.set("scope", scope);

    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await createTemplate(undefined, fd);
        if (result?.error) { setError(result.error); }
        else {
          setOk(true);
          setName("");
          setSubject("");
          setBody("");
          setTimeout(() => setOk(false), 3000);
        }
      } catch { setError("Failed to save template."); }
      finally { setPending(false); }
    });
  };

  const insertVar = (v: string) => setBody((prev) => prev + ` {{${v}}}`);

  const clear = () => { setName(""); setSubject(""); setBody(""); setError(null); };

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open onClose={onClose} size="max-w-2xl" label="New template">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brand-gradient text-white">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-base font-bold">New template</h2>
          <p className="text-[11px] text-[var(--color-muted-foreground)]">Compose a reusable message template for any platform</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Template name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Intro — Product Engineering" className="h-10 text-[13px]" />
          </Field>
          <Field label="Category" required>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 text-[13px]">
              {templateCategories.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Subject line (optional)">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Helping {{company_name}} ship faster" className="h-10 text-[13px]" />
        </Field>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Whiteboard</p>
            <div className="flex items-center gap-1 flex-wrap">
              {["company_name", "contact_name", "sender_name", "service", "website"].map((v) => (
                <button key={v} type="button" onClick={() => insertVar(v)} className="rounded-md bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                  {"{"}{v}{"}"}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            required
            placeholder={"Hi {{contact_name}},\n\nI came across {{company_name}} and wanted to reach out…\n\nBest,\n{{sender_name}}"}
            className="text-[13px] leading-relaxed font-mono !rounded-[14px] !bg-white dark:!bg-white/[0.04] !border"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {detectedVars.length > 0 && (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Variables:</span>
              {detectedVars.map((v) => <Badge key={v} variant="blue">{"{"}{v}{"}"}</Badge>)}
            </>
          )}
          {isAdmin && (
            <Select value={scope} onChange={(e) => setScope(e.target.value as "Team" | "Private")} className="ml-auto w-auto h-8 text-[11px]">
              <option value="Team">Team</option>
              <option value="Private">Private</option>
            </Select>
          )}
        </div>

        {ok && (
          <p className="rounded-[8px] border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-300">
            Template created successfully.
          </p>
        )}
        {error && (
          <p className="rounded-[8px] border border-rose-200/70 bg-rose-50 px-3 py-1.5 text-[12px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Plus className="h-3.5 w-3.5" /> Create template</>}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={clear}><FileText className="h-3.5 w-3.5" /> Clear</Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleCopy} disabled={!body} className="ml-auto">
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryModal({ open, setOpen, categories }: { open: boolean; setOpen: (v: boolean) => void; categories: string[] }) {
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const name = newCat.trim();
    if (!name || name.length < 2) { setError("Name must be at least 2 characters."); return; }
    if (categories.includes(name)) { setError("Already exists."); return; }

    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const result = await addTemplateCategory(undefined, fd);
      if (result?.error) setError(result.error);
      else { setNewCat(""); setError(null); }
    });
  };

  const handleRemove = (name: string) => {
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      await removeTemplateCategory(undefined, fd);
    });
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="max-w-xs" label="Manage categories">
      <h2 className="font-display text-base font-bold mb-3">Template categories</h2>

      <div className="space-y-1 mb-3">
        {categories.map((c) => (
          <div key={c} className="flex items-center justify-between rounded-[8px] border border-[var(--color-border-subtle)] px-2.5 py-1.5">
            <span className="text-[12px] font-semibold">{c}</span>
            <button onClick={() => handleRemove(c)} className="grid h-6 w-6 place-items-center rounded-[6px] hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
              <Trash2 className="h-3 w-3 text-rose-500" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <Input value={newCat} onChange={(e) => { setNewCat(e.target.value); setError(null); }} placeholder="New category" className="h-9 text-[13px]" />
        <Button size="sm" onClick={handleAdd}><Plus className="h-3 w-3" /></Button>
      </div>

      {error && (
        <p className="mt-2 rounded-[8px] border border-rose-200/70 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
          {error}
        </p>
      )}
    </Modal>
  );
}

function DeleteTemplateModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    const fd = new FormData();
    fd.set("templateId", template.id);
    setPending(true);
    startTransition(async () => {
      try {
        const result = await deleteTemplate(undefined, fd);
        if (result?.error) { setError(result.error); }
        else { onClose(); }
      } catch { setError("Failed to delete."); }
      finally { setPending(false); }
    });
  };

  return (
    <Modal open onClose={onClose} size="max-w-sm" label="Delete template">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 mb-3">
          <Trash2 className="h-5 w-5" />
        </div>
        <h2 className="font-display text-base font-bold">Delete template?</h2>
        <p className="mt-1.5 text-[12px] text-[var(--color-muted-foreground)]">
          <span className="font-semibold text-[var(--color-foreground)]">{template.name}</span> will be permanently removed.
        </p>
        {error && <p className="mt-3 rounded-[8px] border border-rose-200/70 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700">{error}</p>}
        <div className="mt-5 flex gap-2">
          <Button onClick={handleDelete} variant="danger" className="flex-1" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : "Delete"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function TemplatePreview({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const handleDownload = () => {
    const full = `Subject: ${template.subject || "(no subject)"}\n\n${template.body}`;
    const blob = new Blob([full], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name.replace(/[^a-zA-Z0-9._-]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open onClose={onClose} size="max-w-xl" label={template.name}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-brand-gradient text-white">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold leading-tight">{template.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide", catTone(template.category))}>
                {template.category}
              </span>
              {template.scope === "Private" && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                  <EyeOff className="h-2.5 w-2.5" /> Private
                </span>
              )}
            </div>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </div>

      {template.subject && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Subject</p>
          <p className="text-[13px] font-semibold mt-0.5">{template.subject}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Body</p>
        <pre className="mt-1.5 whitespace-pre-wrap rounded-[14px] border border-[var(--color-border-subtle)] bg-white/60 dark:bg-white/5 p-4 text-[13px] leading-relaxed font-sans max-h-[40vh] overflow-y-auto">{template.body}</pre>
      </div>

      {template.variables.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Variables</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {template.variables.map((v) => (
              <Badge key={v} variant="blue">{"{"}{v}{"}"}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
        <span>Used {template.usageCount} times</span>
      </div>
    </Modal>
  );
}
