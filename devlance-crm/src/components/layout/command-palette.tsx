"use client";

import { useRouter } from "next/navigation";
import { Command as CommandIcon, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useUIStore } from "@/lib/store";
import { navItems } from "@/lib/navigation";
import { searchCommand } from "@/app/actions/data";
import type { Company, User, EmailTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setSelectedCompany } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, setCommandOpen]);

  return (
    <AnimatePresence>
      {commandOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-start justify-center pt-[12vh] px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCommandOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.97, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -10 }} transition={{ type: "spring", damping: 24, stiffness: 300 }} className="relative w-full max-w-xl glass rounded-[22px] p-3 shadow-[var(--shadow-hover)]">
            <CommandPaletteBody
              onSelectHref={(href) => { setCommandOpen(false); router.push(href); }}
              onSelectCompany={(id) => { setSelectedCompany(id); setCommandOpen(false); router.push("/companies"); }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CommandPaletteBody({ onSelectHref, onSelectCompany }: { onSelectHref: (href: string) => void; onSelectCompany: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ companies: Company[]; people: User[]; templates: EmailTemplate[] }>({ companies: [], people: [], templates: [] });
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      searchCommand(q)
        .then((r) => setResults({ companies: r.companies, people: r.users, templates: r.templates }))
        .catch(() => setResults({ companies: [], people: [], templates: [] }));
    }, 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const filteredNav = query.trim() ? navItems.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase())) : navItems;
  const showEmpty = query.trim().length < 2;
  const allEmpty = results.companies.length === 0 && results.people.length === 0 && results.templates.length === 0 && filteredNav.length === 0;

  return (
    <>
      <div className="flex items-center gap-3 rounded-[14px] bg-black/[0.03] dark:bg-white/[0.05] px-3.5 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a command or search companies, people, templates…" className="flex-1 bg-transparent text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none" />
        <kbd className="inline-flex items-center gap-0.5 rounded-md border border-[var(--color-border-subtle)] px-1.5 py-0.5 text-[10px] font-semibold text-slate-500"><CommandIcon className="h-2.5 w-2.5" /> K</kbd>
      </div>

      <div className="mt-2 max-h-[52vh] overflow-y-auto">
        {!showEmpty && allEmpty && (
          <p className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">No results for &ldquo;{query}&rdquo;</p>
        )}

        {showEmpty && (
          <Section title="Navigate">
            {navItems.map((n) => (<CommandItem key={n.href} onClick={() => onSelectHref(n.href)} icon={<n.icon className="h-4 w-4" />}>{n.label}</CommandItem>))}
          </Section>
        )}

        {filteredNav.length > 0 && !showEmpty && (
          <Section title="Pages">
            {filteredNav.map((n) => (<CommandItem key={n.href} onClick={() => onSelectHref(n.href)} icon={<n.icon className="h-4 w-4" />}>Go to {n.label}</CommandItem>))}
          </Section>
        )}

        {results.companies.length > 0 && (
          <Section title="Companies">
            {results.companies.map((c) => (<CommandItem key={c.id} onClick={() => onSelectCompany(c.id)} icon={<span className="grid h-6 w-6 place-items-center rounded-md bg-blue-100 text-[11px] font-bold text-blue-700">{c.name[0]}</span>}><span className="font-semibold">{c.name}</span><span className="text-xs text-[var(--color-muted-foreground)] ml-1.5">{c.industry}</span></CommandItem>))}
          </Section>
        )}

        {results.people.length > 0 && (
          <Section title="People">
            {results.people.map((u) => (<CommandItem key={u.id} onClick={() => onSelectHref("/team")} icon={<Avatar name={u.name} color={u.avatarColor} size="xs" />}><span className="font-semibold">{u.name}</span><span className="text-xs text-[var(--color-muted-foreground)] ml-1.5">{u.title}</span></CommandItem>))}
          </Section>
        )}

        {results.templates.length > 0 && (
          <Section title="Templates">
            {results.templates.map((t) => (<CommandItem key={t.id} onClick={() => onSelectHref("/templates")} icon={<span className="text-xs">✉</span>}><span className="font-semibold">{t.name}</span><span className="text-xs text-[var(--color-muted-foreground)] ml-1.5">{t.category}</span></CommandItem>))}
          </Section>
        )}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">{title}</p>
      {children}
    </div>
  );
}

function CommandItem({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm", "hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-colors")}>
      <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-black/[0.04] dark:bg-white/[0.06] text-[var(--color-foreground)]">{icon}</span>
      <span className="flex items-center min-w-0">{children}</span>
    </button>
  );
}