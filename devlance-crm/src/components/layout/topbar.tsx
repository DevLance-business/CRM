"use client";

import { Bell, Command, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { useUIStore, useAuthStore } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function TopBar() {
  const { setMobileNavOpen, setCommandOpen, setQuickAddOpen, notifPanelOpen, setNotifPanelOpen } =
    useUIStore();
  const { user, notifications } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const unread = notifications.filter((n) => !n.read).length;

  if (!user) return null;

  return (
    <header className="sticky top-4 z-[55] flex items-center gap-3 px-1 lg:px-6">
      <div className="glass flex h-14 w-full items-center gap-3 rounded-[18px] px-3 sm:px-4 shadow-[var(--shadow-soft)]">
        {/* Mobile menu */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden grid h-9 w-9 place-items-center rounded-[10px] hover:bg-black/[0.04] dark:hover:bg-white/10"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global search */}
        <button
          onClick={() => setCommandOpen(true)}
          className="group flex flex-1 items-center gap-2.5 rounded-[12px] bg-black/[0.03] dark:bg-white/[0.05] px-3 h-10 text-left transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08] max-w-md"
        >
          <Search className="h-4 w-4 text-slate-400" />
          <span className="flex-1 truncate text-sm text-[var(--color-muted-foreground)]">
            Search companies, people, emails…
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-[var(--color-border-subtle)] bg-white/70 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Quick add */}
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setQuickAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Add Company</span>
          </Button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-[12px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setNotifPanelOpen(!notifPanelOpen)}
            className="relative grid h-10 w-10 place-items-center rounded-[12px] border border-[var(--color-border-subtle)] bg-white/40 dark:bg-white/5 hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

        </div>
      </div>

      <NotificationPanel />
    </header>
  );
}

function NotificationPanel() {
  const { notifPanelOpen, setNotifPanelOpen } = useUIStore();
  const { notifications } = useAuthStore();

  return (
    <AnimatePresence>
      {notifPanelOpen && (
        <>
          <div className="fixed inset-0 z-[65]" onClick={() => setNotifPanelOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="fixed top-20 right-5 z-[66] w-[340px] max-w-[calc(100vw-2rem)] glass rounded-[18px] p-2 shadow-[var(--shadow-hover)]"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="font-display text-sm font-bold">Notifications</p>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Mark all read
              </span>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-2.5 rounded-[12px] p-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer",
                    !n.read && "bg-blue-50/40 dark:bg-blue-500/[0.07]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      n.type === "success" && "bg-emerald-500",
                      n.type === "warning" && "bg-amber-500",
                      n.type === "reminder" && "bg-rose-500",
                      n.type === "info" && "bg-blue-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[var(--color-foreground)]">{n.title}</p>
                    <p className="text-[12px] text-[var(--color-muted-foreground)] leading-snug">
                      {n.description}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}