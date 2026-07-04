"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { User } from "@/lib/types";
import type { TeamMemberStats } from "@/lib/data";
import { cn, relativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";

export function TeamView({ teamStats, allUsers }: { teamStats: TeamMemberStats[]; allUsers: User[] }) {

  const chartData = teamStats.map((m) => ({
    name: m.user.name.split(" ")[0],
    emails: m.emailsSent,
    replies: m.pendingReplies,
  }));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="People" title="Team dashboard" description="How each DevLance team member is performing across outreach and pipeline.">
        <AvatarGroup users={allUsers} max={5} />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Outreach by team member</CardTitle>
          <CardDescription>Emails sent this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} width={36} />
                <Tooltip cursor={{ fill: "rgba(37,99,235,0.06)" }} contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border-subtle)", background: "var(--color-surface)", backdropFilter: "blur(16px)", fontSize: 12 }} />
                <Bar dataKey="emails" fill="url(#barBlue)" radius={[6, 6, 0, 0]} barSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {teamStats.map((m, i) => (
          <MemberCard key={m.user.id} m={m} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
}

function MemberCard({ m, delay }: { m: TeamMemberStats; delay: number }) {
  const stats = [
    { label: "Assigned", value: m.assigned, icon: Building2, tone: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300" },
    { label: "Emails", value: m.emailsSent, icon: Building2, tone: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-300" },
    { label: "Pending", value: m.pendingReplies, icon: Building2, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" },
    { label: "Meetings", value: m.meetings, icon: Building2, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card hover>
        <CardContent className="p-5">
          <div className="flex items-center gap-3.5">
            <Avatar name={m.user.name} color={m.user.avatarColor} online={m.user.online} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[16px] font-extrabold truncate">{m.user.name}</h3>
                <Badge variant={m.user.role === "Admin" ? "blue" : m.user.role === "Sales" ? "violet" : "neutral"}>{m.user.role}</Badge>
              </div>
              <p className="text-[12px] text-[var(--color-muted-foreground)] truncate">{m.user.title || m.user.role} · {m.user.email}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <span className="text-[12px] font-bold">{m.avgResponse}%</span>
              </div>
              <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">avg reply</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[12px] border border-[var(--color-border-subtle)] p-2.5 text-center">
                <span className={cn("inline-grid h-7 w-7 place-items-center rounded-[9px] mb-1", s.tone)}><s.icon className="h-3.5 w-3.5" /></span>
                <p className="font-display text-lg font-extrabold leading-none tabular-nums">{s.value}</p>
                <p className="text-[9.5px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {m.lastActivityAt && (
            <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
              <p className="text-[12px] text-[var(--color-secondary-foreground)]">
                <span className="font-semibold">Last active</span>
                <span className="ml-1.5 text-[var(--color-muted-foreground)]">· {relativeTime(m.lastActivityAt)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}