"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  delta?: { value: string; positive: boolean };
  accent?: "blue" | "cyan" | "violet" | "green" | "amber";
  delay?: number;
}

const accentMap = {
  blue: "from-blue-500/12 to-sky-500/8 text-blue-600",
  cyan: "from-cyan-500/12 to-blue-500/8 text-cyan-600",
  violet: "from-violet-500/12 to-indigo-500/8 text-violet-600",
  green: "from-emerald-500/12 to-teal-500/8 text-emerald-600",
  amber: "from-amber-500/12 to-orange-500/8 text-amber-600",
};

export function KpiCard({ label, value, icon: Icon, delta, accent = "blue", delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="glass group relative overflow-hidden rounded-[20px] p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {label}
          </p>
          <p className="font-display text-[28px] font-extrabold leading-none tracking-tight text-[var(--color-foreground)] tabular-nums">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br transition-transform duration-300 group-hover:scale-105",
            accentMap[accent],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      {delta && (
        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold">
          <span
            className={
              delta.positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            {delta.positive ? "▲" : "▼"} {delta.value}
          </span>
          <span className="text-[var(--color-muted-foreground)] font-medium">vs last week</span>
        </div>
      )}
      <div className="pointer-events-none absolute -bottom-12 -right-8 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}