"use client";

import { useState, useRef, startTransition } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FileText, Plus, Search, Upload, FileSpreadsheet, Presentation, FileType,
  Image as ImageIcon, Tag, CloudUpload, X, Loader2, Download, Settings2,
  Trash2, Maximize2, Minimize2,
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
  const [preview, setPreview] = useState<DocumentItem | null>(null);
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
                <Card hover className="group cursor-pointer h-full" onClick={() => setPreview(d)}>
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
      {preview && <DocumentPreview doc={preview} users={users} onClose={() => setPreview(null)} />}
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
          <p className="text-[11.5px] text-[var(--color-muted-foreground)]">PDF, DOCX, XLSX, PPTX, images, or text — up to 5 MB.</p>
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

function DocumentPreview({ doc, users, onClose }: { doc: DocumentItem; users: Record<string, User>; onClose: () => void }) {
  const uploader = users[doc.uploadedBy];
  const previewUrl = `/api/documents/${doc.id}/preview`;
  const downloadUrl = `/api/documents/${doc.id}/download`;
  const isText = doc.type === "text";
  const isPdf = doc.type === "pdf";
  const isImage = doc.type === "image";
  const isPreviewable = isText || isPdf || isImage;

  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textLoaded, setTextLoaded] = useState(false);

  const loadText = () => {
    if (textLoading || textLoaded) return;
    setTextLoading(true);
    fetch(previewUrl)
      .then((res) => res.text())
      .then((t) => { setTextContent(t); setTextLoaded(true); })
      .catch(() => { setTextContent("(Failed to load content)"); setTextLoaded(true); })
      .finally(() => setTextLoading(false));
  };
  const [fullscreen, setFullscreen] = useState(false);

  const handleDownload = () => {
    window.open(downloadUrl, "_blank");
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[95] bg-white dark:bg-slate-950 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[8px]", typeColor(doc.type))}>
              {doc.type === "pdf" ? <FileType className="h-3.5 w-3.5" /> : doc.type === "xlsx" ? <FileSpreadsheet className="h-3.5 w-3.5" /> : doc.type === "pptx" ? <Presentation className="h-3.5 w-3.5" /> : doc.type === "docx" ? <FileText className="h-3.5 w-3.5" /> : doc.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            </div>
            <p className="text-[13px] font-bold truncate">{doc.name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <button onClick={() => setFullscreen(false)} className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300">
              <Minimize2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {isPdf && <iframe src={previewUrl} className="w-full h-full" title={doc.name} />}
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <Image src={previewUrl} alt={doc.name} width={1200} height={900} className="max-w-full max-h-full object-contain" unoptimized />
            </div>
          )}
          {isText && (
            <div className="h-full overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap text-[14px] leading-relaxed font-sans">{textContent || "(Load content to preview)"}</pre>
            </div>
          )}
          {!isPreviewable && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className={cn("grid h-16 w-16 place-items-center rounded-[16px]", typeColor(doc.type))}>
                {doc.type === "pdf" ? <FileType className="h-8 w-8" /> : doc.type === "xlsx" ? <FileSpreadsheet className="h-8 w-8" /> : doc.type === "pptx" ? <Presentation className="h-8 w-8" /> : doc.type === "docx" ? <FileText className="h-8 w-8" /> : doc.type === "image" ? <ImageIcon className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
              </div>
              <p className="font-display text-[16px] font-bold">{doc.name}</p>
              <p className="text-[13px] text-[var(--color-muted-foreground)]">{doc.type.toUpperCase()} · {doc.size}</p>
              <Button onClick={handleDownload}><Download className="h-4 w-4" /> Download file</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal open onClose={onClose} size="max-w-xl" label={doc.name}>
      <div className="flex items-start justify-between gap-3 mb-4 pr-8">
        <div className="flex items-center gap-3">
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[10px]", typeColor(doc.type))}>
            {doc.type === "pdf" ? <FileType className="h-4 w-4" /> : doc.type === "xlsx" ? <FileSpreadsheet className="h-4 w-4" /> : doc.type === "pptx" ? <Presentation className="h-4 w-4" /> : doc.type === "docx" ? <FileText className="h-4 w-4" /> : doc.type === "image" ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold leading-tight">{doc.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-[var(--color-muted-foreground)]">{doc.category} · {doc.size}</span>
              {doc.scope === "Private" && <Badge variant="amber" dot>Private</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" variant="secondary" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          {isPreviewable && (
            <button onClick={() => setFullscreen(true)} className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300" title="Full screen">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isPdf && (
        <div className="rounded-[14px] border border-[var(--color-border-subtle)] overflow-hidden" style={{ height: "60vh" }}>
          <iframe src={previewUrl} className="w-full h-full" title={doc.name} />
        </div>
      )}

      {isImage && (
        <div className="rounded-[14px] border border-[var(--color-border-subtle)] overflow-hidden flex items-center justify-center bg-white/60 dark:bg-white/5" style={{ minHeight: "40vh" }}>
          <Image src={previewUrl} alt={doc.name} width={800} height={600} className="max-w-full max-h-[60vh] object-contain" unoptimized />
        </div>
      )}

      {isText && (
        <div>
          {!textLoaded ? (
            <div className="rounded-[14px] border border-[var(--color-border-subtle)] bg-white/60 dark:bg-white/5 p-8 flex flex-col items-center text-center">
              <p className="font-display text-[14px] font-bold mb-1">{doc.name}</p>
              <p className="text-[12px] text-[var(--color-muted-foreground)] mb-4">{doc.type.toUpperCase()} · {doc.size}</p>
              <Button size="sm" onClick={loadText} disabled={textLoading}>
                {textLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</> : "Preview text"}
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Content</p>
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { setTextLoaded(false); loadText(); }}>
                  Refresh
                </Button>
              </div>
              <pre className="whitespace-pre-wrap rounded-[14px] border border-[var(--color-border-subtle)] bg-white/60 dark:bg-white/5 p-4 text-[13px] leading-relaxed font-sans max-h-[50vh] overflow-y-auto">{textContent || ""}</pre>
            </div>
          )}
        </div>
      )}

      {!isPreviewable && (
        <div className="rounded-[14px] border border-[var(--color-border-subtle)] bg-white/60 dark:bg-white/5 p-6 flex flex-col items-center text-center">
          <div className={cn("grid h-20 w-20 place-items-center rounded-[20px] mb-3", typeColor(doc.type))}>
            {doc.type === "pdf" ? <FileType className="h-10 w-10" /> : doc.type === "xlsx" ? <FileSpreadsheet className="h-10 w-10" /> : doc.type === "pptx" ? <Presentation className="h-10 w-10" /> : doc.type === "docx" ? <FileText className="h-10 w-10" /> : doc.type === "image" ? <ImageIcon className="h-10 w-10" /> : <FileText className="h-10 w-10" />}
          </div>
          <p className="font-display text-[14px] font-bold mt-2">{doc.name}</p>
          <p className="text-[12px] text-[var(--color-muted-foreground)] mt-1">{doc.type.toUpperCase()} · {doc.size}</p>
          <Button size="sm" className="mt-4" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" /> Download file
          </Button>
        </div>
      )}

      <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3 space-y-1.5">
        {doc.version && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--color-muted-foreground)]">Version</span>
            <span className="font-semibold">{doc.version}</span>
          </div>
        )}
        {uploader && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--color-muted-foreground)]">Uploaded by</span>
            <span className="font-semibold">{uploader.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--color-muted-foreground)]">Uploaded</span>
          <span className="font-semibold">{formatDate(doc.uploadedAt)}</span>
        </div>
        {doc.tags.length > 0 && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[var(--color-muted-foreground)] shrink-0">Tags</span>
            <div className="flex gap-1 flex-wrap justify-end">{doc.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
