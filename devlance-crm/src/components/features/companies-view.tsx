"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Building2,
  ChevronDown,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Company, CompanyStatus, User } from "@/lib/types";
import { useUIStore, statusColor } from "@/lib/store";
import { cn, formatDate, isOverdue, relativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, StatusBadge } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";

const statuses: (CompanyStatus | "All")[] = [
  "All",
  "Not Contacted",
  "Outreach Active",
  "Replied",
  "Meeting Scheduled",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
  "On Hold",
];

type SortKey = "name" | "createdAt" | "lastOutreachAt" | "responseRate" | "nextFollowUpAt";

export function CompaniesView({
  companies,
  users,
  teamMembers,
}: {
  companies: Company[];
  users: Record<string, User>;
  teamMembers: User[];
}) {
  const { setSelectedCompany, setQuickAddOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CompanyStatus | "All">("All");
  const [country, setCountry] = useState("All");
  const [assignee, setAssignee] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "lastOutreachAt",
    dir: "desc",
  });
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageSize = 8;

  const userById = (id: string | null) => (id ? users[id] : undefined);
  const countries = useMemo(
    () => ["All", ...Array.from(new Set(companies.map((c) => c.country).filter(Boolean)))],
    [companies],
  );

  const filtered = useMemo(() => {
    let list = companies.filter((c) => {
      if (status !== "All" && c.status !== status) return false;
      if (country !== "All" && c.country !== country) return false;
      if (assignee === "Assigned" && !c.assignedTo) return false;
      if (assignee === "Unassigned" && c.assignedTo) return false;
      if (assignee !== "All" && assignee !== "Assigned" && assignee !== "Unassigned" && c.assignedTo !== assignee) return false;
      if (query) {
        const q = query.toLowerCase();
        const inText =
          c.name.toLowerCase().includes(q) ||
          c.emails.some((e) => e.toLowerCase().includes(q)) ||
          c.website.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q);
        if (!inText) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const va = a[sort.key] ?? "";
      const vb = b[sort.key] ?? "";
      if (va === "" && vb === "") return 0;
      if (va === "") return 1;
      if (vb === "") return -1;
      if (typeof va === "number" && typeof vb === "number") return sort.dir === "asc" ? va - vb : vb - va;
      const sa = typeof va === "string" ? va : String(va);
      const sb = typeof vb === "string" ? vb : String(vb);
      return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return list;
  }, [query, status, country, assignee, sort, companies]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));

  const activeFilters = [status !== "All", country !== "All", assignee !== "All"].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Company database"
        title="Companies"
        description="Every company DevLance has approached — one master record each, no duplicates."
      >
        <Button variant="secondary" onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeFilters > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </Button>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Company
        </Button>
      </PageHeader>

      {/* Search + sort row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, domain, notes…"
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sort.key}
            onChange={(e) => setSort((s) => ({ ...s, key: e.target.value as SortKey }))}
            className="w-auto min-w-[170px]"
          >
            <option value="lastOutreachAt">Sort: Last outreach</option>
            <option value="createdAt">Sort: Date added</option>
            <option value="name">Sort: Name</option>
            <option value="responseRate">Sort: Response rate</option>
            <option value="nextFollowUpAt">Sort: Follow-up</option>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      {filtersOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[18px] p-4 grid gap-3 sm:grid-cols-3"
        >
          <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v as CompanyStatus | "All"); setPage(1); }} options={statuses} />
          <FilterSelect label="Country" value={country} onChange={(v) => { setCountry(v); setPage(1); }} options={countries} />
          <FilterSelect
            label="Assigned to"
            value={assignee}
            onChange={(v) => { setAssignee(v); setPage(1); }}
            options={["All", "Assigned", "Unassigned", ...teamMembers.map((m) => m.id)]}
            render={(o) =>
              o === "All" || o === "Assigned" || o === "Unassigned"
                ? o
                : userById(o)?.name ?? o
            }
          />
        </motion.div>
      )}

      {/* Table */}
      {pageItems.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          title="No companies match your filters"
          description="Try adjusting the search or clearing filters to see more records."
          action={
            <Button variant="secondary" onClick={() => { setQuery(""); setStatus("All"); setCountry("All"); setAssignee("All"); }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-[20px]">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <Th onClick={() => toggleSort("name")} active={sort.key === "name"}>Company</Th>
                  <Th>Status</Th>
                  <Th>Owner</Th>
                  <Th onClick={() => toggleSort("nextFollowUpAt")} active={sort.key === "nextFollowUpAt"}>Follow-up</Th>
                  <Th onClick={() => toggleSort("lastOutreachAt")} active={sort.key === "lastOutreachAt"}>Last outreach</Th>
                  <Th onClick={() => toggleSort("responseRate")} active={sort.key === "responseRate"} align="right">Response</Th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <CompanyRow key={c.id} c={c} onOpen={() => setSelectedCompany(c.id)} users={users} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-[var(--color-border-subtle)]">
            {pageItems.map((c) => (
              <CompanyCardMobile key={c.id} c={c} onOpen={() => setSelectedCompany(c.id)} users={users} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </p>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  );
}

function Th({ children, onClick, active, align }: { children: React.ReactNode; onClick?: () => void; active?: boolean; align?: "right" }) {
  return (
    <th className={cn("px-5 py-3.5 font-bold", align === "right" && "text-right", onClick && "cursor-pointer select-none")}>
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 hover:text-[var(--color-foreground)]", active && "text-blue-600 dark:text-blue-400")}>
        {children}
        {active && <ChevronDown className="h-3 w-3" />}
      </button>
    </th>
  );
}

function CompanyRow({ c, onOpen, users }: { c: Company; onOpen: () => void; users: Record<string, User> }) {
  const owner = c.assignedTo ? users[c.assignedTo] : null;
  const overdue = c.nextFollowUpAt ? isOverdue(c.nextFollowUpAt) : false;
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-[var(--color-border-subtle)] last:border-0 transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-500/[0.06]"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand-gradient text-[13px] font-bold text-white">
            {c.name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold truncate flex items-center gap-1.5">
              {c.name}
              {c.locked && <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor(c.status) }} />}
            </p>
            <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">{c.industry} · {c.country}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
      <td className="px-5 py-3.5">
        {owner ? (
          <div className="flex items-center gap-2">
            <Avatar name={owner.name} color={owner.avatarColor} size="sm" online={owner.online} />
            <span className="text-[12.5px] font-semibold">{owner.name.split(" ")[0]}</span>
          </div>
        ) : (
          <span className="text-[12px] text-slate-400">Unassigned</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        {c.nextFollowUpAt ? (
          <Badge variant={overdue ? "red" : "neutral"}>
            {overdue ? "Overdue" : formatDate(c.nextFollowUpAt, { month: "short", day: "numeric" })}
          </Badge>
        ) : (
          <span className="text-[12px] text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-[12.5px] text-[var(--color-secondary-foreground)]">
        {c.lastOutreachAt ? relativeTime(c.lastOutreachAt) : <span className="text-slate-400">Never</span>}
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="font-display font-extrabold text-gradient text-[15px]">{c.responseRate}%</span>
      </td>
    </tr>
  );
}

function CompanyCardMobile({ c, onOpen, users }: { c: Company; onOpen: () => void; users: Record<string, User> }) {
  const owner = c.assignedTo ? users[c.assignedTo] : null;
  return (
    <button onClick={onOpen} className="w-full text-left p-4 hover:bg-blue-50/40 dark:hover:bg-blue-500/[0.06] transition-colors">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand-gradient text-sm font-bold text-white">
          {c.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-[14px] truncate">{c.name}</p>
            <StatusBadge status={c.status} />
          </div>
          <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">{c.industry} · {c.country}</p>
          <div className="mt-2 flex items-center justify-between">
            {owner ? (
              <div className="flex items-center gap-1.5">
                <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
                <span className="text-[11.5px] font-semibold">{owner.name.split(" ")[0]}</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Unassigned</span>
            )}
            <span className="font-display font-extrabold text-gradient text-[14px]">{c.responseRate}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  render,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  render?: (o: string) => string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-[var(--color-foreground)]">
        <Filter className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
        {label}
      </label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{render ? render(o) : o}</option>
        ))}
      </Select>
    </div>
  );
}