"use client";

import { useState, useRef, startTransition } from "react";
import { motion } from "framer-motion";
import {
  FileText, Plus, Search, Upload, FileSpreadsheet, Presentation, FileType,
  Image as ImageIcon, Tag, CloudUpload, X, Loader2, Download, Settings2,
  Trash2,
} from "lucide-react";
import type { DocumentItem, User } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Field, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/states";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadDocument, addCustomCategory, removeCustomCategory } from "@/app/actions/crm";

const defaultCategories = [
  "Company Profile",
  "Portfolio",
  "Pricing Sheet",
  "Case Studies",
  "Proposal Templates",
  "Brochures",
  "Contracts",
  "Certificates",
];

function typeIcon(type: DocumentItem["type"]) {
  switch (type) {
    case "pdf": return FileType;
    case "xlsx": return FileSpreadsheet;
    case "pptx": return Presentation;
    case "docx": return FileText;
    case "image": return ImageIcon;
    case "text": return FileText;
    default: return FileText;
  }
}

function typeColor(type: DocumentItem["type"]) {
  switch (type) {
    case "pdf": return "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300";
    case "xlsx": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "pptx": return "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300";
    case "docx": return "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300";
    case "image": return "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300";
    case "text": return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
    default: return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
  }
}

export function DocumentsView({ documents, users, customCategories }: { documents: DocumentItem[]; users: Record<string, User>; customCategories: string[] }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "Admin";
  const allCategories = [...new Set([...defaultCategories, ...customCategories])];
  const [tab, setTab] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const userById = (id: string) => users[id] ?? undefined;

  const filtered = documents.filter((d) => {
    if (tab !== "All" && d.category !== tab) return false;
    if (query && !d.name.toLowerCase().includes(query.toLowerCase()) && !d.tags.some((t) => t.includes(query.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Knowledge base" title="Document library" description="Company profile, portfolio, case studies, contracts — the DevLance asset vault.">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="secondary" size="sm" onClick={() => setCatOpen(true)}>
              <Settings2 className="h-4 w-4" /> Categories
            </Button>
          )}
          <Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Upload</Button>
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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files or tags…" className="pl-10" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText className="h-7 w-7" />} title="No documents here yet" description="Upload company profile, portfolio or contracts to keep them one click away." action={<Button onClick={() => setUploadOpen(true)}><Plus className="h-4 w-4" /> Upload document</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d, i) => {
            const Icon = typeIcon(d.type);
            const uploader = userById(d.uploadedBy);
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card hover className="group cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn("grid h-10 w-10 place-items-center rounded-[12px]", typeColor(d.type))}><Icon className="h-5 w-5" /></div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{d.version}</Badge>
                        {d.scope === "Private" && <Badge variant="amber" dot>Private</Badge>}
                      </div>
                    </div>
                    <h3 className="mt-2.5 font-display text-[13.5px] font-bold leading-tight line-clamp-2">{d.name}</h3>
                    <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">{d.category} · {d.size}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {d.tags.slice(0, 3).map((t) => (<span key={t} className="inline-flex items-center gap-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-secondary-foreground)]"><Tag className="h-2.5 w-2.5" /> {t}</span>))}
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
                      {uploader && (<div className="flex items-center gap-1.5"><Avatar name={uploader.name} color={uploader.avatarColor} size="xs" /><span className="text-[11px] font-semibold text-[var(--color-muted-foreground)]">{formatDate(d.uploadedAt)}</span></div>)}
                      <a href={`/api/documents/${d.id}/download`} download onClick={(e) => e.stopPropagation()} className="grid h-8 w-8 place-items-center rounded-[10px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors">
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <UploadModal open={uploadOpen} setOpen={setUploadOpen} categories={allCategories} />
      {isAdmin && <CategoryModal open={catOpen} setOpen={setCatOpen} customCategories={customCategories} />}
    </div>
  );
}

function UploadModal({ open, setOpen, categories }: { open: boolean; setOpen: (v: boolean) => void; categories: string[] }) {
  const [drag, setDrag] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "Admin";

  if (!open && !pending) {
    if (error) setError(null);
    return;
  }

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    if (mode === "file") {
      if (!selectedFile) {
        setError("Please select a file.");
        return;
      }
      formData.set("file", selectedFile);
      formData.delete("textContent");
    } else {
      const text = (formData.get("textContent") as string || "").trim();
      if (!text) {
        setError("Please enter some text content.");
        return;
      }
      formData.set("textContent", text);
    }

    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await uploadDocument(undefined, formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setOpen(false);
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setPending(false);
      }
    });
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="max-w-md" label="Upload document">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brand-gradient text-white"><CloudUpload className="h-4 w-4" /></div>
        <div>
          <h2 className="font-display text-base font-bold">Upload a document</h2>
          <p className="text-[11.5px] text-[var(--color-muted-foreground)]">PDF, DOCX, XLSX, PPTX, images, or plain text.</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-1 rounded-[10px] bg-black/[0.04] dark:bg-white/[0.05] p-0.5">
          <button type="button" onClick={() => setMode("file")} className={cn("flex-1 rounded-[8px] py-1.5 text-[12px] font-semibold transition-colors", mode === "file" ? "bg-white dark:bg-white/15 shadow-sm" : "text-[var(--color-muted-foreground)]")}>
            File
          </button>
          <button type="button" onClick={() => setMode("text")} className={cn("flex-1 rounded-[8px] py-1.5 text-[12px] font-semibold transition-colors", mode === "text" ? "bg-white dark:bg-white/15 shadow-sm" : "text-[var(--color-muted-foreground)]")}>
            Text
          </button>
        </div>

        {mode === "file" ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            className={cn("rounded-[12px] border-2 border-dashed p-5 text-center transition-colors cursor-pointer", drag ? "border-blue-400 bg-blue-50/50" : "border-[var(--color-border-subtle)] bg-white/30 dark:bg-white/[0.03]")}
          >
            <CloudUpload className="mx-auto h-8 w-8 text-blue-500" />
            <p className="mt-1.5 text-[13px] font-bold">{fileName ? fileName : "Drag & drop or click"}</p>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">Up to 10 MB</p>
            <label className="mt-2 inline-block">
              <span className="text-[11px] font-semibold text-blue-600 cursor-pointer">Browse files</span>
              <input type="file" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        ) : (
          <Textarea name="textContent" rows={4} placeholder="Paste notes, snippets, or any text content here…" className="text-[13px]" />
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Name" required className="col-span-2">
            <Input name="name" required placeholder="Document name" className="h-10" />
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue={categories[0]} className="h-10">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Version">
            <Input name="version" defaultValue="v1.0" placeholder="v1.0" className="h-10" />
          </Field>
          <Field label="Tags" className="col-span-2">
            <Input name="tags" placeholder="pitch, overview" className="h-10" />
          </Field>
          {isAdmin && (
            <Field label="Visibility" className="col-span-2">
              <Select name="scope" defaultValue="Team" className="h-10">
                <option value="Team">Team — visible to everyone</option>
                <option value="Private">Private — only visible to me</option>
              </Select>
            </Field>
          )}
        </div>

        {error && (
          <p className="rounded-[8px] border border-rose-200/70 bg-rose-50 px-3 py-1.5 text-[11.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload</>}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}><X className="h-4 w-4" /> Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryModal({ open, setOpen, customCategories }: { open: boolean; setOpen: (v: boolean) => void; customCategories: string[] }) {
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const name = newCat.trim();
    if (!name || name.length < 2) { setError("Name must be at least 2 characters."); return; }
    if (defaultCategories.includes(name) || customCategories.includes(name)) { setError("Already exists."); return; }

    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const result = await addCustomCategory(undefined, fd);
      if (result?.error) setError(result.error);
      else { setNewCat(""); setError(null); }
    });
  };

  const handleRemove = (name: string) => {
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      await removeCustomCategory(undefined, fd);
    });
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="max-w-xs" label="Manage categories">
      <h2 className="font-display text-base font-bold mb-3">Manage categories</h2>

      <div className="space-y-1.5 mb-3">
        {defaultCategories.map((c) => (
          <div key={c} className="flex items-center justify-between rounded-[8px] border border-[var(--color-border-subtle)] px-2.5 py-1.5">
            <span className="text-[12px] font-semibold">{c}</span>
            <Badge variant="outline">built-in</Badge>
          </div>
        ))}
        {customCategories.map((c) => (
          <div key={c} className="flex items-center justify-between rounded-[8px] border border-[var(--color-border-subtle)] px-2.5 py-1.5">
            <span className="text-[12px] font-semibold">{c}</span>
            <button onClick={() => handleRemove(c)} className="grid h-6 w-6 place-items-center rounded-[6px] hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
              <Trash2 className="h-3 w-3 text-rose-500" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <Input value={newCat} onChange={(e) => { setNewCat(e.target.value); setError(null); }} placeholder="New category name" className="h-9 text-[13px]" />
        <Button size="sm" onClick={handleAdd}><Plus className="h-3.5 w-3.5" /></Button>
      </div>

      {error && (
        <p className="mt-2 rounded-[8px] border border-rose-200/70 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
          {error}
        </p>
      )}
    </Modal>
  );
}
