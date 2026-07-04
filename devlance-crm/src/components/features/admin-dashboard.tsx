"use client";

import { motion } from "framer-motion";
import {
  Building2, CalendarClock, MailCheck, Send, Clock3, CalendarCheck2,
  TrendingUp, Plus, ArrowRight, Users2, Repeat2,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardData, KpiPoint, Company, Activity } from "@/lib/types";
import type { TeamMemberStats } from "@/lib/data";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ActivityFeed } from "@/components/features/activity-feed";
import { useUIStore } from "@/lib/store";
import { isOverdue, formatDate, cn, relativeTime } from "@/lib/utils";
import Link from "next/link";

interface Props {
  stats: DashboardData & { weeklyActivity: KpiPoint[] };
  activities: Activity[];
  companies: Company[];
  teamStats: TeamMemberStats[];
  adminName: string;
}

export function AdminDashboard({ stats, activities, companies, teamStats, adminName }: Props) {
  const { setQuickAddOpen } = useUIStore();
  const kpis = [
    { label: "Total Companies", value: stats.totalCompanies, icon: Building2, accent: "blue" as const, delta: { value: "12%", positive: true } },
    { label: "Companies Assigned", value: stats.companiesAssigned, icon: Users2, accent: "violet" as const, delta: { value: "8%", positive: true } },
    { label: "Emails Sent Today", value: stats.emailsSentToday, icon: Send, accent: "cyan" as const, delta: { value: "23%", positive: true } },
    { label: "Replies Received", value: stats.repliesReceived, icon: MailCheck, accent: "green" as const, delta: { value: "4%", positive: true } },
    { label: "Follow-ups Due", value: stats.followUpsDue, icon: Clock3, accent: "amber" as const, delta: { value: "2", positive: false } },
    { label: "Meetings Scheduled", value: stats.meetingsScheduled, icon: CalendarCheck2, accent: "violet" as const, delta: { value: "1", positive: true } },
    { label: "Active Outreach", value: stats.activeOutreach, icon: Repeat2, accent: "cyan" as const, delta: { value: "3", positive: true } },
    { label: "Response Rate", value: `${stats.responseRate}%`, icon: TrendingUp, accent: "blue" as const, delta: { value: "5%", positive: true } },
  ];

  const upcoming = companies
    .filter((c) => c.nextFollowUpAt)
    .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime())
    .slice(0, 5);

  const quickActions = [
    { label: "Add Company", icon: Plus, action: () => setQuickAddOpen(true) },
    { label: "Log Email", icon: Send, href: "/outreach" },
    { label: "Schedule Follow-up", icon: CalendarClock, href: "/outreach" },
    { label: "Manage Team", icon: Users2, href: "/settings" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Admin overview
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Welcome, <span className="text-gradient">{adminName.split(" ")[0]}</span> 👋
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
            Full visibility into your team&apos;s outreach and pipeline activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary"><CalendarClock className="h-4 w-4" /> This week</Button>
          <Button onClick={() => setQuickAddOpen(true)}><Plus className="h-4 w-4" /> Add Company</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k, i) => (<KpiCard key={k.label} {...k} delay={i * 0.05} />))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Weekly outreach activity</CardTitle>
              <CardDescription>Across the whole team — emails sent vs replies</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Sent</span>
              <span className="flex items-center gap-1.5 font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Replies</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyActivity} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gReply" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} width={36} />
                  <Tooltip
                    cursor={{ stroke: "rgba(37,99,235,0.2)", strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: 14, border: "1px solid var(--color-border-subtle)",
                      background: "var(--color-surface)", backdropFilter: "blur(16px)",
                      boxShadow: "0 20px 40px -12px rgba(37,99,235,0.16)", fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#2563eb" strokeWidth={2.5} fill="url(#gSent)" />
                  <Area type="monotone" dataKey="replies" stroke="#22d3ee" strokeWidth={2.5} fill="url(#gReply)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Follow-ups due</CardTitle>
              <CardDescription>Across the team</CardDescription>
            </div>
            <Badge variant="amber" dot>{stats.followUpsDue} due</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-[var(--color-muted-foreground)]">No follow-ups scheduled.</p>
            ) : upcoming.map((c) => {
              const overdue = isOverdue(c.nextFollowUpAt!);
              return (
                <Link key={c.id} href="/companies" className="group flex items-center gap-3 rounded-[12px] border border-[var(--color-border-subtle)] p-2.5 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-500/[0.07] transition-colors">
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

      {/* Team performance breakdown — admin only */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team performance</CardTitle>
            <CardDescription>Per-member outreach breakdown — admin view</CardDescription>
          </div>
          <Link href="/team" className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            View team <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teamStats.map((m, i) => (
              <motion.div
                key={m.user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-[16px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.user.name} color={m.user.avatarColor} online={m.user.online} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate">{m.user.name}</p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">{m.user.role === "Admin" ? "Admin" : m.user.title || m.user.role}</p>
                  </div>
                  <Badge variant={m.user.role === "Admin" ? "blue" : m.user.role === "Sales" ? "violet" : "neutral"}>{m.user.role}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <Stat value={m.assigned} label="Owned" />
                  <Stat value={m.emailsSent} label="Emails" />
                  <Stat value={m.pendingReplies} label="Waiting" />
                  <Stat value={m.won} label="Won" />
                </div>
                {m.lastActivityAt && (
                  <p className="mt-3 text-[10.5px] text-[var(--color-muted-foreground)]">
                    Last active {relativeTime(m.lastActivityAt)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions + All-team activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump straight into the work</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2.5">
            {quickActions.map((a) => (
              <motion.button
                key={a.label}
                whileHover={{ y: -2 }}
                onClick={() => (a.action ? a.action() : undefined)}
                className="flex flex-col items-start gap-2 rounded-[14px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/[0.04] p-3.5 text-left hover:border-blue-300 hover:shadow-soft transition-all"
              >
                <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-brand-gradient text-white"><a.icon className="h-4 w-4" /></span>
                <span className="text-[13px] font-bold">{a.label}</span>
              </motion.button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All team activity</CardTitle>
              <CardDescription>Every action across every member</CardDescription>
            </div>
            <Link href="/activity" className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-[var(--color-muted-foreground)]">No activity yet.</p>
            ) : (
              <ActivityFeed items={activities.slice(0, 6)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-base font-extrabold tabular-nums">{value}</p>
      <p className="text-[9.5px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">{label}</p>
    </div>
  );
}