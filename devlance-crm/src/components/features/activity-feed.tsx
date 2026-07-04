"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
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

export function ActivityFeed({ items, className }: { items: Activity[]; className?: string }) {
  return (
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
            className="group flex gap-3 rounded-[12px] px-2.5 py-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
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
  );
}