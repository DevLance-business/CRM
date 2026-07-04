import { create } from "zustand";
import type { CompanyStatus, User } from "@/lib/types";
import type { SessionUser } from "@/app/actions/auth";

interface UIState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  selectedCompanyId: string | null;
  quickAddOpen: boolean;
  notifPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setMobileNavOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setSelectedCompany: (id: string | null) => void;
  setQuickAddOpen: (v: boolean) => void;
  setNotifPanelOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandOpen: false,
  selectedCompanyId: null,
  quickAddOpen: false,
  notifPanelOpen: false,
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setSelectedCompany: (id) => set({ selectedCompanyId: id }),
  setQuickAddOpen: (v) => set({ quickAddOpen: v }),
  setNotifPanelOpen: (v) => set({ notifPanelOpen: v }),
}));

const statusToColor: Record<CompanyStatus, string> = {
  "Not Contacted": "#94a3b8",
  "Outreach Active": "#2563eb",
  Replied: "#22d3ee",
  "Meeting Scheduled": "#8b5cf6",
  "Proposal Sent": "#f59e0b",
  "Closed Won": "#16a34a",
  "Closed Lost": "#dc2626",
  "On Hold": "#64748b",
};

export function statusColor(status: CompanyStatus): string {
  return statusToColor[status] ?? "#94a3b8";
}

interface AuthState {
  user: User | null;
  notifications: { id: string; title: string; description: string; createdAt: string; read: boolean; type: "info" | "success" | "warning" | "reminder" }[];
  hydrateUser: (u: SessionUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  notifications: [],
  hydrateUser: (u) =>
    set(() =>
      u
        ? {
            user: {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              title: u.title ?? "",
              avatarColor: u.avatarColor,
              online: u.online,
            },
          }
        : { user: null },
    ),
}));