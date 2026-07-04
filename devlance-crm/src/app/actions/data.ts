"use server";

// Re-exports of server-only data functions as callable server actions
// for client components (company drawer, command palette, etc.)

import { getCompanyDetails, searchCommand } from "@/lib/data";

export { getCompanyDetails, searchCommand };