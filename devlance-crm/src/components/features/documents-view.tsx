"use client";

import { useState, useRef, startTransition } from "react";
import { motion } from "framer-motion";
import {
  FileText, Plus, Search, Upload,
  FileSpreadsheet, Presentation, FileType,
  Image as ImageIcon, Tag, CloudUpload, X, Loader2, Download,
} from "lucide-react";
import type { DocumentCategory, DocumentItem, User } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Field, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/states";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadDocument } from "@/app/actions/crm";

const categories: (DocumentCategory | "All")[] = [
  "All", "Company Profile", "Portfolio", "Pricing Sheet", "Case Studies",
  "Proposal Templates", "Brochures", "Contracts", "Certificates",
];

function typeIcon(type: DocumentItem["type"]) {
  switch (type) {
    case "pdf": return FileType;
    case "xlsx": return FileSpreadsheet;
    case "pptx": return Presentation;
    case "docx": return FileText;
    case "image": return ImageIcon;
  }
}

function typeColor(type: DocumentItem["type"]) {
  switch (type) {
    case "pdf": return "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300";
    case "xlsx": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "pptx": return "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300";
    case "docx": return "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300";
    case "image": return "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300";
  }
}

export function DocumentsView({ documents, users }: { documents: DocumentItem[]; users: Record<string, User> }) {
  const [tab, setTab] = useState<DocumentCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const userById = (id: string) => users[id] ?? undefined;

  const filtered = documents.filter((d) => {
    if (tab !== "All" && d.category !== tab) return false;
    if (query && !d.name.toLowerCase().includes(query.toLowerCase()) && !d.tags.some((t) => t.includes(query.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Knowledge base" title="Document library" description="Company profile, portfolio, case studies, contracts — the DevLance asset vault.">
        <Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Upload</Button>
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as DocumentCategory | "All")} variant="pill">
          <TabsList className="flex-wrap">
            {categories.map((c) => (<TabsTrigger key={c} value={c}>{c}</TabsTrigger>))}
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
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn("grid h-12 w-12 place-items-center rounded-[14px]", typeColor(d.type))}><Icon className="h-6 w-6" /></div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{d.version}</Badge>
                        {d.scope === "Private" && <Badge variant="amber" dot>Private</Badge>}
                      </div>
                    </div>
                    <h3 className="mt-3 font-display text-[14.5px] font-bold leading-tight line-clamp-2">{d.name}</h3>
                    <p className="mt-1 text-[11.5px] text-[var(--color-muted-foreground)]">{d.category} · {d.size}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {d.tags.slice(0, 3).map((t) => (<span key={t} className="inline-flex items-center gap-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-secondary-foreground)]"><Tag className="h-2.5 w-2.5" /> {t}</span>))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
                      {uploader && (<div className="flex items-center gap-1.5"><Avatar name={uploader.name} color={uploader.avatarColor} size="xs" /><span className="text-[11px] font-semibold text-[var(--color-muted-foreground)]">{formatDate(d.uploadedAt)}</span></div>)}
                      <a
                        href={`/api/documents/${d.id}/download`}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="grid h-8 w-8 place-items-center rounded-[10px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
                      >
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

      <UploadModal open={uploadOpen} setOpen={setUploadOpen} categories={categories} />
    </div>
  );
}

function UploadModal({ open, setOpen, categories }: { open: boolean; setOpen: (v: boolean) => void; categories: (DocumentCategory | "All")[] }) {
  const [drag, setDrag] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("file", selectedFile);

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
    <Modal open={open} onClose={() => setOpen(false)} size="max-w-lg" label="Upload document">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-gradient text-white"><CloudUpload className="h-5 w-5" /></div>
        <div>
          <h2 className="font-display text-lg font-bold">Upload a document</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">PDF, DOCX, XLSX, PPTX or images up to 50 MB.</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className={cn("rounded-[16px] border-2 border-dashed p-8 text-center transition-colors", drag ? "border-blue-400 bg-blue-50/50 dark:bg-blue-500/[0.08]" : "border-[var(--color-border-subtle)] bg-white/30 dark:bg-white/[0.03]")}
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"><CloudUpload className="h-7 w-7" /></div>
          <p className="mt-3 font-display font-bold text-[15px]">
            {fileName ? fileName : "Drag & drop files here"}
          </p>
          <p className="text-[12px] text-[var(--color-muted-foreground)] mt-1">or browse from your device</p>
          <label className="mt-4 inline-flex">
            <span className="inline-flex items-center gap-2 rounded-[12px] bg-brand-gradient px-4 py-2 text-[13px] font-semibold text-white cursor-pointer"><Plus className="h-4 w-4" /> Browse files</span>
            <input
              type="file"
              multiple={false}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3.5">
          <Field label="Document name" required className="col-span-2">
            <Input name="name" required placeholder="Company Profile — DevLance 2026" />
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue="Company Profile">
              {categories.slice(1).map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Version label">
            <Input name="version" defaultValue="v1.0" placeholder="v1.0" />
          </Field>
          <Field label="Tags" className="col-span-2">
            <Input name="tags" placeholder="pitch, overview, case-study" />
          </Field>
          {isAdmin && (
            <Field label="Visibility" className="col-span-2">
              <Select name="scope" defaultValue="Team">
                <option value="Team">Team — visible to everyone</option>
                <option value="Private">Private — only visible to me</option>
              </Select>
            </Field>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload</>}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}><X className="h-4 w-4" /> Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}