"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { AddCompanyModal } from "@/components/features/add-company-modal";
import { CompanyDetailsDrawer } from "@/components/features/company-drawer";
import { SessionHydrator } from "@/components/layout/session-hydrator";
import { useUIStore } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{
          paddingLeft: sidebarCollapsed ? "calc(76px + 1rem + 1.5rem)" : "calc(264px + 1rem + 1.5rem)",
          paddingRight: "1.5rem",
        }}
      >
        <div className="pt-4" />
        <TopBar />
        <main className="pt-6">{children}</main>
      </div>
      <CommandPalette />
      <AddCompanyModal />
      <CompanyDetailsDrawer />
      <SessionHydrator />
    </div>
  );
}