"use client";

import {
  Building2, MailCheck, Send, Clock3, CalendarCheck2,
  TrendingUp, Plus, ArrowRight, Repeat2,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardData, KpiPoint, Company, Activity } from "@/lib/types";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityFeed } from "@/components/features/activity-feed";
import { useUIStore } from "@/lib/store";
import { isOverdue, formatDate, cn } from "@/lib/utils";
import Link from "next/link";

interface Props {
  stats: DashboardData & { weeklyActivity: KpiPoint[] };
  activities: Activity[];
  companies: Company[];
  memberName: string;
}

export function MemberDashboard({ stats, activities, companies, memberName }: Props) {
  const { setQuickAddOpen } = useUIStore();
  const kpis = [
    { label: "My Companies", value: stats.totalCompanies, icon: Building2, accent: "blue" as const },
    { label: "Emails Sent Today", value: stats.emailsSentToday, icon: Send, accent: "cyan" as const },
    { label: "Replies Received", value: stats.repliesReceived, icon: MailCheck, accent: "green" as const },
    { label: "Follow-ups Due", value: stats.followUpsDue, icon: Clock3, accent: "amber" as const },
    { label: "My Meetings", value: stats.meetingsScheduled, icon: CalendarCheck2, accent: "violet" as const },
    { label: "Active Outreach", value: stats.activeOutreach, icon: Repeat2, accent: "cyan" as const },
    { label: "Response Rate", value: `${stats.responseRate}%`, icon: TrendingUp, accent: "blue" as const },
  ];

  const upcoming = companies
    .filter((c) => c.nextFollowUpAt)
    .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Your workspace
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Hi, <span className="text-gradient">{memberName.split(" ")[0]}</span> 👋
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
            Here&apos;s your outreach queue and recent activity.
          </p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)}><Plus className="h-4 w-4" /> Add Company</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k, i) => (<KpiCard key={k.label} {...k} delay={i * 0.05} />))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your weekly activity</CardTitle>
            <CardDescription>Emails sent vs replies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyActivity} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mReply" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} width={36} />
                  <Tooltip
                    cursor={{ stroke: "rgba(37,99,235,0.2)" }}
                    contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border-subtle)", background: "var(--color-surface)", backdropFilter: "blur(16px)", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#2563eb" strokeWidth={2.5} fill="url(#mSent)" />
                  <Area type="monotone" dataKey="replies" stroke="#22d3ee" strokeWidth={2.5} fill="url(#mReply)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your follow-ups</CardTitle>
              <CardDescription>Scheduled & overdue</CardDescription>
            </div>
            <Badge variant="amber" dot>{stats.followUpsDue} due</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-[var(--color-muted-foreground)]">Nothing scheduled.</p>
            ) : upcoming.map((c) => {
              const overdue = isOverdue(c.nextFollowUpAt!);
              return (
                <Link key={c.id} href="/companies" className="group flex items-center gap-3 rounded-[12px] border border-[var(--color-border-subtle)] p-2.5 hover:border-blue-300 transition-colors">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-brand-gradient text-white text-[11px] font-bold">{c.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{c.name}</p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)]">{c.industry}</p>
                  </div>
                  <div className={cn("text-right text-[11px] font-semibold", overdue ? "text-rose-600 dark:text-rose-400" : "text-slate-500")}>
                    <p>{overdue ? "Overdue" : formatDate(c.nextFollowUpAt!, { month: "short", day: "numeric" })}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your recent activity</CardTitle>
            <CardDescription>Everything you&apos;ve done lately</CardDescription>
          </div>
          <Link href="/activity" className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-[var(--color-muted-foreground)]">No activity yet. Start by adding a company or logging an email.</p>
          ) : (
            <ActivityFeed items={activities.slice(0, 8)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}