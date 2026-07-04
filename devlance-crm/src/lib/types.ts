export type Role = "Admin" | "Sales" | "Team Member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatarColor: string;
  online: boolean;
}

export type CompanyStatus =
  | "Not Contacted"
  | "Outreach Active"
  | "Replied"
  | "Meeting Scheduled"
  | "Proposal Sent"
  | "Closed Won"
  | "Closed Lost"
  | "On Hold";

export type CompanySource =
  | "LinkedIn"
  | "Referral"
  | "Cold List"
  | "Inbound"
  | "Clutch"
  | "Upwork"
  | "Event";

export interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  country: string;
  linkedin: string;
  emails: string[];
  phone: string;
  companySize: string;
  source: CompanySource;
  notes: string;
  createdBy: string;
  assignedTo: string | null;
  status: CompanyStatus;
  createdAt: string;
  locked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  lastOutreachAt: string | null;
  nextFollowUpAt: string | null;
  followUpCount: number;
  responseRate: number;
}

export type EmailStatus = "Draft" | "Sent" | "Waiting for Reply" | "Replied";

export interface EmailRecord {
  id: string;
  companyId: string;
  subject: string;
  templateId: string | null;
  senderId: string;
  body: string;
  sentAt: string;
  status: EmailStatus;
  notes: string;
  attachments: string[];
}

export type TemplateCategory = string;

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  scope: "Team" | "Private";
  createdBy: string;
}

export type DocumentCategory = string;

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  size: string;
  type: "pdf" | "pptx" | "docx" | "xlsx" | "image" | "text";
  uploadedBy: string;
  uploadedAt: string;
  version: string;
  tags: string[];
  url: string;
  scope: "Team" | "Private";
}

export type ActivityType =
  | "company_added"
  | "company_assigned"
  | "email_sent"
  | "reply_received"
  | "follow_up_scheduled"
  | "meeting_created"
  | "notes_updated"
  | "document_uploaded"
  | "outreach_started"
  | "outreach_released"
  | "status_changed";

export interface Activity {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName?: string;
  actorAvatarColor?: string;
  companyId: string | null;
  createdAt: string;
  message: string;
  meta?: Record<string, string>;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  type: "info" | "success" | "warning" | "reminder";
}

export interface KpiPoint {
  day: string;
  sent: number;
  replies: number;
}

export interface DashboardData {
  totalCompanies: number;
  companiesAssigned: number;
  emailsSentToday: number;
  repliesReceived: number;
  followUpsDue: number;
  meetingsScheduled: number;
  activeOutreach: number;
  responseRate: number;
  weeklyActivity: KpiPoint[];
}