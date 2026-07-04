import {
  Activity as ActivityIcon,
  Building2,
  FileText,
  LayoutDashboard,
  Mail,
  Send,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Outreach", href: "/outreach", icon: Send },
  { label: "Email Templates", href: "/templates", icon: Mail },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Activity", href: "/activity", icon: ActivityIcon },
  { label: "Team", href: "/team", icon: Users, adminOnly: true },
  { label: "Settings", href: "/settings", icon: Settings, adminOnly: true },
];