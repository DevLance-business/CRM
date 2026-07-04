"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Globe,
  Link2,
  Mail,
  Lock,
  Unlock,
  Send,
  CalendarClock,
  Hash,
  Phone,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  FileText,
  Building2,
  Loader2,
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import { getCompanyDetails } from "@/app/actions/data";
import type { CompanyDetails } from "@/lib/data";
import type { EmailRecord } from "@/lib/types";
import { Avatar, StatusBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, domainFromUrl, formatDate, formatDateTime, relativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { startOutreach, releaseOutreach } from "@/app/actions/crm";
import { useRouter } from "next/navigation";

export function CompanyDetailsDrawer() {
  const { selectedCompanyId, setSelectedCompany } = useUIStore();
  const open = !!selectedCompanyId;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCompany(null)} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }} className="absolute top-0 right-0 bottom-0 w-full max-w-[560px] glass !rounded-none border-0 overflow-y-auto">
            {selectedCompanyId && <DrawerBody key={selectedCompanyId} companyId={selectedCompanyId} onClose={() => setSelectedCompany(null)} />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const [data, setData] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyDetails(companyId)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;
  }
  if (!data) {
    return <div className="p-10 text-center text-sm text-[var(--color-muted-foreground)]">Company not found or you don&apos;t have access.</div>;
  }

  return <DrawerContent data={data} onClose={onClose} />;
}

function DrawerContent({ data, onClose }: { data: CompanyDetails; onClose: () => void }) {
  const { company, emails, users } = data;
  const { user } = useAuthStore();
  const router = useRouter();
  const userById = (id: string | null) => (id ? users[id] : undefined);
  const owner = company.assignedTo ? userById(company.assignedTo) : null;
  const creator = userById(company.createdBy);
  const [tab, setTab] = useState<"overview" | "timeline" | "documents">("overview");
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const isLockedByOther = company.locked && company.lockedBy && company.lockedBy !== user.id;
  const lockOwner = company.lockedBy ? userById(company.lockedBy) : null;

  const handleLockToggle = async () => {
    setBusy(true);
    try {
      if (company.locked && company.lockedBy === user.id) {
        await releaseOutreach(company.id);
        toast.success(`${company.name} released. Outreach available to others.`);
        onClose();
        router.refresh();
      } else if (!company.locked) {
        await startOutreach(company.id);
        toast.success(`Outreach started for ${company.name}. You now hold the lock.`);
        onClose();
        router.refresh();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 pb-10 pt-5">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-[10px] bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /></svg>
      </button>

      <div className="flex items-start gap-3.5 pr-10">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-brand-gradient text-white text-xl font-bold">{company.name[0]}</div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-extrabold tracking-tight truncate">{company.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={company.status} />
            <Badge variant="neutral">{company.industry}</Badge>
            {company.locked && (<Badge variant="blue" dot><Lock className="h-3 w-3" /> Locked</Badge>)}
          </div>
        </div>
      </div>

      {isLockedByOther && lockOwner && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-[16px] border border-blue-200/70 bg-blue-50/70 dark:bg-blue-500/[0.1] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-blue-500 text-white"><AlertTriangle className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold">This company is currently being handled by {lockOwner.name}.</p>
              <p className="text-[12px] text-[var(--color-secondary-foreground)] mt-0.5">Outreach is locked until {lockOwner.name.split(" ")[0]} releases it, or an Admin reassigns ownership.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-[10px] bg-white/60 dark:bg-white/5 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Locked since</p>
                  <p className="font-bold mt-0.5">{company.lockedAt ? relativeTime(company.lockedAt) : "—"}</p>
                </div>
                <div className="rounded-[10px] bg-white/60 dark:bg-white/5 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Last email</p>
                  <p className="font-bold mt-0.5">{company.lastOutreachAt ? relativeTime(company.lastOutreachAt) : "Never"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {company.locked && company.lockedBy === user.id ? (
          <Button variant="danger" onClick={handleLockToggle} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Unlock className="h-4 w-4" /> Release outreach</>}</Button>
        ) : company.lockedBy !== user.id ? (
          <Button variant="secondary" disabled><Lock className="h-4 w-4" /> Locked by {lockOwner?.name.split(" ")[0]}</Button>
        ) : null}
        {!company.locked && (<Button onClick={handleLockToggle} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Start Outreach</>}</Button>)}
        <Button variant="secondary"><CalendarClock className="h-4 w-4" /> Schedule follow-up</Button>
        <Button variant="secondary"><Mail className="h-4 w-4" /> Log email</Button>
      </div>

      <div className="mt-6 flex items-center gap-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] p-1">
        {(["overview", "timeline", "documents"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("flex-1 rounded-full px-3 py-1.5 text-[13px] font-semibold capitalize transition-colors relative", tab === t ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]")}>
            {tab === t && <span className="absolute inset-0 rounded-full bg-white shadow dark:bg-white/10" />}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <InfoTile icon={Globe} label="Website" value={domainFromUrl(company.website)} href={company.website} />
            <InfoTile icon={Hash} label="Company size" value={company.companySize} />
            <InfoTile icon={Globe} label="Country" value={company.country} />
            <InfoTile icon={Building2} label="Source" value={company.source} />
            <InfoTile icon={Phone} label="Phone" value={company.phone} />
            <InfoTile icon={Link2} label="LinkedIn" value={domainFromUrl(company.linkedin)} href={company.linkedin} />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Emails</p>
            <div className="space-y-1.5">
              {company.emails.map((e) => (
                <div key={e} className="flex items-center gap-2 rounded-[10px] border border-[var(--color-border-subtle)] px-3 py-2 text-[13px]">
                  <Mail className="h-3.5 w-3.5 text-blue-500" /><span className="font-medium">{e}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Notes</p>
            <p className="rounded-[12px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 p-3.5 text-[13px] leading-relaxed text-[var(--color-secondary-foreground)]">{company.notes}</p>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">Ownership &amp; timeline</p>
            <div className="grid grid-cols-2 gap-3">
              <FieldBlock label="Assigned to">
                {owner ? (<div className="flex items-center gap-2"><Avatar name={owner.name} color={owner.avatarColor} size="sm" online={owner.online} /><div><p className="text-[13px] font-bold leading-tight">{owner.name}</p><p className="text-[11px] text-[var(--color-muted-foreground)]">{owner.title}</p></div></div>) : (<span className="text-[13px] text-slate-400">— Unassigned</span>)}
              </FieldBlock>
              <FieldBlock label="Created by">
                {creator ? (<div className="flex items-center gap-2"><Avatar name={creator.name} color={creator.avatarColor} size="sm" /><div><p className="text-[13px] font-bold leading-tight">{creator.name}</p><p className="text-[11px] text-[var(--color-muted-foreground)]">{formatDate(company.createdAt)}</p></div></div>) : null}
              </FieldBlock>
              <FieldBlock label="Last outreach"><span className="text-[13px] font-bold">{company.lastOutreachAt ? formatDateTime(company.lastOutreachAt) : "Never"}</span></FieldBlock>
              <FieldBlock label="Next follow-up">
                <span className="text-[13px] font-bold">{company.nextFollowUpAt ? formatDate(company.nextFollowUpAt, { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                <p className="text-[11px] text-[var(--color-muted-foreground)]">{company.followUpCount} follow-ups</p>
              </FieldBlock>
              <FieldBlock label="Response rate"><span className="font-display text-xl font-extrabold text-gradient">{company.responseRate}%</span></FieldBlock>
            </div>
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div className="mt-5">
          {emails.length === 0 ? (<div className="text-center py-10 text-sm text-[var(--color-muted-foreground)]">No emails logged yet.</div>) : (
            <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--color-border-subtle)]">
              {emails.map((e: EmailRecord) => {
                const sender = userById(e.senderId);
                return (
                  <li key={e.id} className="relative pl-10">
                    <span className={cn("absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full ring-4 ring-[var(--color-background)]", e.status === "Replied" ? "bg-emerald-500" : e.status === "Waiting for Reply" ? "bg-amber-500" : "bg-blue-500")}>
                      <Mail className="h-3.5 w-3.5 text-white" />
                    </span>
                    <div className="rounded-[14px] border border-[var(--color-border-subtle)] bg-white/50 dark:bg-white/5 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold truncate">{e.subject || "(no subject)"}</p>
                        <Badge variant={e.status === "Replied" ? "green" : e.status === "Waiting for Reply" ? "amber" : e.status === "Draft" ? "neutral" : "blue"}>{e.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
                        {sender && <Avatar name={sender.name} color={sender.avatarColor} size="xs" />}
                        <span className="font-semibold text-[var(--color-secondary-foreground)]">{sender?.name}</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" /><span>{relativeTime(e.sentAt)}</span>
                      </div>
                      {e.notes && <p className="mt-2 text-[12px] text-[var(--color-secondary-foreground)]">{e.notes}</p>}
                      {e.attachments.length > 0 && (<div className="mt-2 flex flex-wrap gap-1.5">{e.attachments.map((a: string) => (<span key={a} className="inline-flex items-center gap-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[11px] font-semibold"><FileText className="h-3 w-3" /> {a}</span>))}</div>)}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="mt-5">
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-10">Company-specific documents appear here. <br /><span className="inline-flex items-center gap-1 mt-2 font-semibold text-blue-600 dark:text-blue-400">Open the global Documents library <ArrowUpRight className="h-3.5 w-3.5" /></span></p>
        </div>
      )}
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, href }: { icon: import("lucide-react").LucideIcon; label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-[12px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 p-3 hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"><Icon className="h-3 w-3" /> {label}</div>
      <p className="mt-1 text-[13px] font-bold truncate">{value || "—"}</p>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer">{content}</a>;
  return content;
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}