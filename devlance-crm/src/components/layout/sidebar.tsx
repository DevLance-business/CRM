"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { navItems } from "@/lib/navigation";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "Admin";

  return (
    <>
      {/* Mobile rail */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[70] h-0" />

      <motion.aside
        animate={{ width: sidebarCollapsed ? 76 : 264 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className={cn(
          "hidden lg:flex fixed top-4 left-4 bottom-4 z-[60] flex-col",
          "glass !rounded-[24px] py-5 px-3.5 shadow-[var(--shadow-soft)]",
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center gap-2.5 px-1.5 mb-6", sidebarCollapsed && "justify-center px-0")}>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand-gradient shadow-[0_8px_18px_-6px_rgba(37,99,235,0.6)]">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          {!sidebarCollapsed && (
            <div className="leading-tight">
              <p className="font-display text-[15px] font-extrabold tracking-tight">DevLance</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                Outreach CRM
              </p>
            </div>
          )}
        </div>

        {/* Workspace selector */}
        {!sidebarCollapsed && (
          <button className="mb-4 flex items-center justify-between gap-2 rounded-[12px] border border-[var(--color-border-subtle)] bg-white/50 dark:bg-white/5 px-3 py-2.5 text-left hover:border-blue-300 transition-colors">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Workspace
              </p>
              <p className="truncate text-[13px] font-bold">DevLance HQ</p>
            </div>
            <ChevronsRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  sidebarCollapsed && "justify-center px-0",
                  active
                    ? "text-[var(--color-foreground)] bg-blue-50/60 dark:bg-blue-500/10"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-brand-gradient"
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active && "text-blue-600 dark:text-blue-400",
                  )}
                  strokeWidth={2}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade card */}
        {!sidebarCollapsed && (
          <div className="mt-4 rounded-[16px] bg-brand-gradient p-4 text-white overflow-hidden relative">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-xl" />
            <Sparkles className="h-5 w-5 mb-2" />
            <p className="text-[13px] font-bold leading-tight">Supercharge outreach</p>
            <p className="text-[11px] text-white/80 mt-1 leading-snug">
              AI-assisted sequencing for Pro teams.
            </p>
            <div className="mt-3 rounded-[10px] bg-white/20 px-2.5 py-1.5 text-[12px] font-semibold inline-flex items-center gap-1">
              Explore <ChevronsRight className="h-3.5 w-3.5" />
            </div>
          </div>
        )}

        {/* Profile */}
        <div className="relative mt-3">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-3 rounded-[12px] p-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors",
              sidebarCollapsed && "justify-center p-1.5",
            )}
          >
            <Avatar name={user.name} color={user.avatarColor} online={user.online} size="sm" />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[13px] font-bold">{user.name}</p>
                <p className="truncate text-[11px] text-[var(--color-muted-foreground)]">{user.role}</p>
              </div>
            )}
            {!sidebarCollapsed && <ChevronsRight className="h-3.5 w-3.5 text-slate-400" />}
          </button>

          <AnimatePresence>
            {profileOpen && !sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="absolute bottom-full left-0 right-0 mb-2 rounded-[14px] glass p-1.5 shadow-[var(--shadow-hover)]"
              >
                <ProfileMenuItem icon={SettingsIcon} label="Account settings" />
                <ProfileMenuItem icon={HelpCircle} label="Help & docs" />
                <div className="my-1 h-px bg-[var(--color-border-subtle)]" />
                <ProfileMenuItem icon={LogOut} label="Sign out" danger onClick={() => void(logout())} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[12px] font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
        >
          {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : (<><ChevronsLeft className="h-4 w-4" /> Collapse</>)}
        </button>
      </motion.aside>

      {/* Mobile bottom sheet trigger handled in TopBar; here we render the mobile nav */}
      <AnimatePresence>
        <MobileNav key="mobile-nav" />
      </AnimatePresence>
    </>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: LucideIconLike;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold transition-colors",
        danger
          ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          : "text-[var(--color-foreground)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

type LucideIconLike = import("lucide-react").LucideIcon;

function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();
  const pathname = usePathname();
  const { user } = useAuthStore();
  if (!user) return null;
  const isAdmin = user.role === "Admin";

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="absolute top-0 left-0 bottom-0 w-72 glass !rounded-none p-4 flex flex-col"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-brand-gradient">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-display text-[15px] font-extrabold">DevLance</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                  Outreach CRM
                </p>
              </div>
            </div>
            <Button size="sm" className="mb-4" onClick={() => setMobileNavOpen(false)}>
              <Plus className="h-4 w-4" /> Quick Add Company
            </Button>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-blue-50/70 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                        : "text-[var(--color-muted-foreground)] hover:bg-black/[0.03]",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-[var(--color-border-subtle)] p-2.5">
              <Avatar name={user.name} color={user.avatarColor} online={user.online} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold">{user.name}</p>
                <p className="truncate text-[11px] text-[var(--color-muted-foreground)]">{user.email}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}