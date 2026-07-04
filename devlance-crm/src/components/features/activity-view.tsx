"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ActivityFeed } from "@/components/features/activity-feed";

type Filter = "All" | ActivityType;
const filters: Filter[] = [
  "All",
  "company_added",
  "email_sent",
  "reply_received",
  "follow_up_scheduled",
  "meeting_created",
  "status_changed",
];

function labelFor(f: Filter) {
  if (f === "All") return "All";
  return f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupByDay(items: Activity[]) {
  const groups = new Map<string, Activity[]>();
  for (const a of [...items].sort((x, y) => y.createdAt.localeCompare(x.createdAt))) {
    const d = new Date(a.createdAt);
    const key = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(a);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function ActivityView({ activities }: { activities: Activity[] }) {
  const [tab, setTab] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const filtered = activities.filter((a) => {
    if (tab !== "All" && a.type !== tab) return false;
    if (query) {
      const q = query.toLowerCase();
      const inText = a.message.toLowerCase().includes(q) || (a.actorName ?? "").toLowerCase().includes(q) || Object.values(a.meta ?? {}).join(" ").toLowerCase().includes(q);
      if (!inText) return false;
    }
    return true;
  });

  const grouped = groupByDay(filtered);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Audit log" title="Activity timeline" description="Every action across DevLance CRM, recorded chronologically." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Filter)} variant="pill">
          <TabsList className="flex-wrap">
            {filters.map((f) => (<TabsTrigger key={f} value={f}>{labelFor(f)}</TabsTrigger>))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor or detail…" className="pl-10" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Filter className="h-7 w-7" />} title="No activity matches" description="Try a different filter or clear the search." />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <div className="sticky top-2 z-10 mb-2 inline-flex">
                <span className="glass !rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-secondary-foreground)]">{label}</span>
              </div>
              <Card className="p-3"><ActivityFeed items={items} /></Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}