"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  FileText,
  Mail,
  CalendarClock,
  Users,
  Send,
  RotateCcw,
  CheckCircle2,
  StickyNote,
  X,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { cn, relativeTime, formatDateTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const iconFor: Record<ActivityType, LucideIcon> = {
  company_added: Building2,
  company_assigned: Users,
  email_sent: Mail,
  reply_received: RotateCcw,
  follow_up_scheduled: CalendarClock,
  meeting_created: CalendarClock,
  notes_updated: StickyNote,
  document_uploaded: FileText,
  outreach_started: Send,
  outreach_released: RotateCcw,
  status_changed: CheckCircle2,
};

const toneFor: Record<ActivityType, string> = {
  company_added: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  company_assigned: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  email_sent: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  reply_received: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  follow_up_scheduled: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  meeting_created: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  notes_updated: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  document_uploaded: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
  outreach_started: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  outreach_released: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  status_changed: "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
};

const labelFor: Record<ActivityType, string> = {
  company_added: "Company added",
  company_assigned: "Company assigned",
  email_sent: "Email sent",
  reply_received: "Reply received",
  follow_up_scheduled: "Follow-up scheduled",
  meeting_created: "Meeting created",
  notes_updated: "Notes updated",
  document_uploaded: "Document uploaded",
  outreach_started: "Outreach started",
  outreach_released: "Outreach released",
  status_changed: "Status changed",
};

export function ActivityFeed({ items, className }: { items: Activity[]; className?: string }) {
  const [selected, setSelected] = useState<Activity | null>(null);

  return (
    <>
      <div className={cn("space-y-1", className)}>
        {items.map((a, i) => {
          const actorName = a.actorName ?? "Someone";
          const actorAvatarColor = a.actorAvatarColor ?? "from-slate-400 to-slate-500";
          const Icon = iconFor[a.type];
          const company = a.companyId;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              onClick={() => setSelected(a)}
              className="group flex gap-3 rounded-[12px] px-2.5 py-2 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
            >
              <div className="relative flex flex-col items-center">
                <Avatar name={actorName} color={actorAvatarColor} size="sm" />
                {i < items.length - 1 && (
                  <span className="absolute top-9 bottom-0 w-px bg-[var(--color-border-subtle)]" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13.5px] leading-snug">
                  <span className="font-bold">{actorName}</span>{" "}
                  <span className="text-[var(--color-secondary-foreground)]">{a.message}</span>
                  {company && (
                    <span className={cn("ml-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", toneFor[a.type])}>
                      <Icon className="h-3 w-3" />
                      {a.meta?.subject ?? a.meta?.source ?? a.meta?.from ?? a.meta?.due ?? ""}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">{relativeTime(a.createdAt)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[90] grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative w-full max-w-md glass rounded-[24px] p-6 shadow-[var(--shadow-hover)] max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-[10px] bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[14px]", toneFor[selected.type])}>
                  {(() => { const Icon = iconFor[selected.type]; return <Icon className="h-5 w-5" />; })()}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">{labelFor[selected.type]}</h2>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{labelFor[selected.type]} activity</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-[14px] border border-[var(--color-border-subtle)] p-3.5">
                  <Avatar name={selected.actorName ?? "Someone"} color={selected.actorAvatarColor ?? "from-slate-400 to-slate-500"} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold">{selected.actorName ?? "Someone"}</p>
                    <p className="text-[12px] text-[var(--color-muted-foreground)]">Actor</p>
                  </div>
                </div>

                <div className="rounded-[14px] border border-[var(--color-border-subtle)] p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5">Message</p>
                  <p className="text-[13.5px] leading-relaxed">{selected.message}</p>
                </div>

                {selected.meta && Object.keys(selected.meta).length > 0 && (
                  <div className="rounded-[14px] border border-[var(--color-border-subtle)] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2">Details</p>
                    <div className="space-y-1.5">
                      {Object.entries(selected.meta).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="text-[12px] text-[var(--color-muted-foreground)] truncate max-w-[60%]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[12px] text-[var(--color-muted-foreground)]">
                  <span>Created</span>
                  <span className="font-semibold">{formatDateTime(selected.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}