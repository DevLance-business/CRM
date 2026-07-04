/**
 * DevLance CRM — seed script
 * Populates the Neon DB with realistic sample data tied to the existing Admin.
 *
 * Usage:
 *   npx tsx prisma/seed.ts            # idempotent — skips if already seeded
 *   npx tsx prisma/seed.ts --force    # re-seed (deletes existing demo data first)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86_400_000 - 3_600_000);
const daysAhead = (d: number) => new Date(now + d * 86_400_000 + 7_200_000);
const hoursAgo = (h: number) => new Date(now - h * 3_600_000);

async function main() {
  const force = process.argv.includes("--force");
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("✗ No Admin user found. Sign up at /signup first, then run the seed.");
    process.exit(1);
  }

  const alreadySeeded = await prisma.company.findFirst();
  if (alreadySeeded && !force) {
    console.log("✓ Database already seeded. Use --force to re-seed.");
    process.exit(0);
  }

  if (force) {
    console.log("→ Clearing existing demo data…");
    await prisma.activity.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.emailTemplate.deleteMany({});
    await prisma.documentItem.deleteMany({});
    console.log("→ Cleared.");
  }

  // ── Templates ──────────────────────────────────────────────
  console.log("→ Seeding email templates…");
  const templates = await Promise.all([
    prisma.emailTemplate.create({ data: {
      name: "Cold Intro — Product Engineering", category: "COLD_OUTREACH",
      subject: "Helping {{company_name}} ship faster",
      body: "Hi {{contact_name}},\n\nI came across {{company_name}} and loved what you're building in the {{service}} space. DevLance partners with founders to scale product engineering and design without the hiring overhead.\n\nWould you be open to a quick 15-min intro next week?\n\nBest,\n{{sender_name}}",
      variables: ["company_name", "contact_name", "sender_name", "service"], usageCount: 142,
    }}),
    prisma.emailTemplate.create({ data: {
      name: "Gentle Follow-up", category: "FOLLOW_UP",
      subject: "Re: Helping {{company_name}} ship faster",
      body: "Hi {{contact_name}},\n\nFloating this back to the top of your inbox. If timing isn't right, no worries at all — let me know and I'll circle back in a quarter.\n\n{{sender_name}}",
      variables: ["contact_name", "sender_name", "company_name"], usageCount: 98,
    }}),
    prisma.emailTemplate.create({ data: {
      name: "Meeting Request", category: "MEETING_REQUEST",
      subject: "15 minutes next week?",
      body: "Hi {{contact_name}},\n\nGiven {{company_name}}'s work on {{service}}, I suspect a short call would be mutually useful. Would Tuesday or Thursday afternoon work for a 15-min Google Meet?\n\nBest,\n{{sender_name}}",
      variables: ["contact_name", "company_name", "service", "sender_name"], usageCount: 67,
    }}),
    prisma.emailTemplate.create({ data: {
      name: "Proposal Recap", category: "PROPOSAL",
      subject: "DevLance proposal for {{company_name}}",
      body: "Hi {{contact_name}},\n\nFollowing our call, here's the tailored proposal for {{company_name}}. I've attached the scope, timeline, and pricing details for your {{service}} initiative.\n\nHappy to refine — just say the word.\n\n{{sender_name}}",
      variables: ["company_name", "contact_name", "service", "sender_name"], usageCount: 34,
    }}),
    prisma.emailTemplate.create({ data: {
      name: "Thank You Post-Meeting", category: "THANK_YOU",
      subject: "Great chatting, {{contact_name}}",
      body: "Hi {{contact_name}},\n\nThanks for the time today — really enjoyed learning more about {{company_name}}'s roadmap. As discussed, I'll send over the case studies by end of week.\n\nWarmly,\n{{sender_name}}",
      variables: ["contact_name", "company_name", "sender_name"], usageCount: 51,
    }}),
    prisma.emailTemplate.create({ data: {
      name: "LinkedIn Opener", category: "LINKEDIN_MESSAGE",
      subject: "",
      body: "Hi {{contact_name}} — really impressed by {{company_name}}'s growth. We help teams like yours scale product engineering. Open to connecting?",
      variables: ["contact_name", "company_name"], usageCount: 210,
    }}),
  ]);

  // ── Documents ───────────────────────────────────────────────
  console.log("→ Seeding documents…");
  const docs: Array<{ name: string; category: "COMPANY_PROFILE" | "PORTFOLIO" | "PRICING_SHEET" | "CASE_STUDIES" | "PROPOSAL_TEMPLATES" | "BROCHURES" | "CONTRACTS" | "CERTIFICATES"; size: string; type: string; version: string; tags: string[]; url: string }> = [
    { name: "DevLance Company Profile 2026.pdf", category: "COMPANY_PROFILE", size: "2.4 MB", type: "pdf", version: "v3.1", tags: ["pitch", "overview"], url: "#" },
    { name: "Portfolio — Selected Works 2025.pdf", category: "PORTFOLIO", size: "18.7 MB", type: "pdf", version: "v2.0", tags: ["portfolio", "case-studies"], url: "#" },
    { name: "Pricing Sheet — Engineering Pods.xlsx", category: "PRICING_SHEET", size: "640 KB", type: "xlsx", version: "v1.4", tags: ["pricing", "engagement-models"], url: "#" },
    { name: "Case Study — Northwind Labs.pdf", category: "CASE_STUDIES", size: "4.1 MB", type: "pdf", version: "v1.0", tags: ["ai", "infra", "case-study"], url: "#" },
    { name: "Proposal Template — Product Engineering.docx", category: "PROPOSAL_TEMPLATES", size: "1.1 MB", type: "docx", version: "v2.3", tags: ["proposal", "template"], url: "#" },
    { name: "Sales Brochure — DevLance Brand.pdf", category: "BROCHURES", size: "8.9 MB", type: "pdf", version: "v2.0", tags: ["marketing", "brand"], url: "#" },
    { name: "MSA — Master Services Agreement.pdf", category: "CONTRACTS", size: "780 KB", type: "pdf", version: "v4.0", tags: ["legal", "contract"], url: "#" },
    { name: "ISO 27001 Certificate.pdf", category: "CERTIFICATES", size: "320 KB", type: "pdf", version: "v1.0", tags: ["compliance", "security"], url: "#" },
  ];
  for (const d of docs) {
    await prisma.documentItem.create({ data: { ...d, uploadedById: admin.id, uploadedAt: daysAgo(40) } });
  }

  // ── Companies ───────────────────────────────────────────────
  console.log("→ Seeding companies, emails, activities…");
  type CompanySeed = {
    id: string;
    name: string; website: string; industry: string; country: string; linkedin: string;
    contactEmails: string[]; phone: string; companySize: string;
    source: "LINKEDIN" | "REFERRAL" | "COLD_LIST" | "INBOUND" | "CLUTCH" | "UPWORK" | "EVENT";
    notes: string;
    status: "NOT_CONTACTED" | "OUTREACH_ACTIVE" | "REPLIED" | "MEETING_SCHEDULED" | "PROPOSAL_SENT" | "CLOSED_WON" | "CLOSED_LOST" | "ON_HOLD";
    locked?: boolean;
    followUpCount: number; responseRate: number;
    createdDaysAgo: number; lastOutreachHoursAgo?: number; nextFollowUpDaysAhead?: number;
    emails: Array<{ subject: string; templateIdx: number; status: "DRAFT" | "SENT" | "WAITING_FOR_REPLY" | "REPLIED"; sentHoursAgo: number; notes?: string; attachments?: string[] }>;
  };

  const companiesSeed: CompanySeed[] = [
    {
      id: "c1", name: "Northwind Labs", website: "https://northwindlabs.io", industry: "AI / SaaS", country: "United States",
      linkedin: "https://linkedin.com/company/northwindlabs", contactEmails: ["growth@northwindlabs.io", "partnerships@northwindlabs.io"],
      phone: "+1 (415) 555-0142", companySize: "50-200", source: "LINKEDIN",
      notes: "Series-B AI infra startup. Building agentic workflows. Strong fit for our engineering + design pod.",
      status: "OUTREACH_ACTIVE", locked: true, followUpCount: 2, responseRate: 41,
      createdDaysAgo: 18, lastOutreachHoursAgo: 6, nextFollowUpDaysAhead: 1,
      emails: [
        { subject: "Helping Northwind Labs ship faster", templateIdx: 0, status: "SENT", sentHoursAgo: 168, notes: "Sent to growth@northwindlabs.io" },
        { subject: "Re: Helping Northwind Labs ship faster", templateIdx: 1, status: "REPLIED", sentHoursAgo: 96, notes: "VP Eng replied — booked intro call." },
        { subject: "Recap: agentic infra + DevLance scope", templateIdx: 3, status: "WAITING_FOR_REPLY", sentHoursAgo: 6, notes: "Awaiting response from VP Eng.", attachments: ["Northwind scope.pdf"] },
      ],
    },
    {
      id: "c2", name: "Lattice & Co.", website: "https://latticework.co", industry: "FinTech", country: "United Kingdom",
      linkedin: "https://linkedin.com/company/lattice-co", contactEmails: ["hello@latticework.co"],
      phone: "+44 20 7946 0321", companySize: "200-500", source: "REFERRAL",
      notes: "B2B payments orchestration. Looking to redesign onboarding + build a partner portal.",
      status: "MEETING_SCHEDULED", followUpCount: 4, responseRate: 62,
      createdDaysAgo: 26, lastOutreachHoursAgo: 48, nextFollowUpDaysAhead: 2,
      emails: [
        { subject: "Introduction — DevLance x Lattice", templateIdx: 0, status: "REPLIED", sentHoursAgo: 480, notes: "Head of Product interested." },
        { subject: "15 minutes next week?", templateIdx: 2, status: "SENT", sentHoursAgo: 216, notes: "Call booked for Thursday." },
      ],
    },
    {
      id: "c3", name: "Helix Digital", website: "https://helixdigital.com", industry: "Marketing Agency", country: "Canada",
      linkedin: "https://linkedin.com/company/helix-digital", contactEmails: ["bizdev@helixdigital.com", "cto@helixdigital.com"],
      phone: "+1 (647) 555-0198", companySize: "10-50", source: "CLUTCH",
      notes: "Mid-size performance marketing agency. White-label dev capacity opportunity.",
      status: "PROPOSAL_SENT", followUpCount: 5, responseRate: 55,
      createdDaysAgo: 41, lastOutreachHoursAgo: 120, nextFollowUpDaysAhead: -1, // overdue
      emails: [
        { subject: "DevLance proposal for Helix Digital", templateIdx: 3, status: "SENT", sentHoursAgo: 288, notes: "Proposal sent — white-label pod.", attachments: ["Helix proposal.pdf"] },
      ],
    },
    {
      id: "c4", name: "Polaris Health", website: "https://polaris.health", industry: "HealthTech", country: "Germany",
      linkedin: "https://linkedin.com/company/polaris-health", contactEmails: ["contact@polaris.health"],
      phone: "+49 30 5550 129", companySize: "500-1000", source: "COLD_LIST",
      notes: "Telemedicine platform expanding into EU markets. Needs localized web platform.",
      status: "NOT_CONTACTED", followUpCount: 0, responseRate: 0, createdDaysAgo: 3,
      emails: [],
    },
    {
      id: "c5", name: "Quanta Robotics", website: "https://quantarobotics.ai", industry: "Robotics", country: "Singapore",
      linkedin: "https://linkedin.com/company/quanta-robotics", contactEmails: ["partners@quantarobotics.ai"],
      phone: "+65 6555 0143", companySize: "50-200", source: "LINKEDIN",
      notes: "Warehouse robotics. Needs a developer partner for fleet dashboard + telemetry.",
      status: "REPLIED", followUpCount: 3, responseRate: 73,
      createdDaysAgo: 12, lastOutreachHoursAgo: 24, nextFollowUpDaysAhead: 1,
      emails: [
        { subject: "Fleet dashboard partnership", templateIdx: 0, status: "REPLIED", sentHoursAgo: 240, notes: "Strong interest, shared specs." },
      ],
    },
    {
      id: "c6", name: "Meridian Studio", website: "https://meridianstudio.design", industry: "Design Studio", country: "Australia",
      linkedin: "https://linkedin.com/company/meridian-studio", contactEmails: ["studio@meridianstudio.design"],
      phone: "+61 2 5550 1190", companySize: "10-50", source: "INBOUND",
      notes: "Brand-led design studio. Wants DevLance as dev partner for client builds.",
      status: "CLOSED_WON", followUpCount: 6, responseRate: 88,
      createdDaysAgo: 54, lastOutreachHoursAgo: 216,
      emails: [
        { subject: "Introduction — DevLance x Meridian", templateIdx: 0, status: "REPLIED", sentHoursAgo: 1080 },
      ],
    },
    {
      id: "c7", name: "Verdant Logistics", website: "https://verdantlogistics.com", industry: "Logistics", country: "Netherlands",
      linkedin: "https://linkedin.com/company/verdant-logistics", contactEmails: ["ops@verdantlogistics.com", "growth@verdantlogistics.com"],
      phone: "+31 20 555 0890", companySize: "200-500", source: "EVENT",
      notes: "Last-mile logistics. Met at Web Summit. Exploring a route-optimization SaaS.",
      status: "ON_HOLD", followUpCount: 2, responseRate: 33,
      createdDaysAgo: 33, lastOutreachHoursAgo: 264, nextFollowUpDaysAhead: 3,
      emails: [],
    },
    {
      id: "c8", name: "Atlas Realty Group", website: "https://atlasrealty.com", industry: "Real Estate", country: "United Arab Emirates",
      linkedin: "https://linkedin.com/company/atlas-realty-group", contactEmails: ["digital@atlasrealty.com"],
      phone: "+971 4 555 0123", companySize: "500-1000", source: "COLD_LIST",
      notes: "Luxury real estate. Digitizing property portal + broker CRM.",
      status: "CLOSED_LOST", followUpCount: 4, responseRate: 12,
      createdDaysAgo: 72, lastOutreachHoursAgo: 480,
      emails: [],
    },
    {
      id: "c9", name: "Cobalt Commerce", website: "https://cobaltcommerce.io", industry: "E-commerce", country: "United States",
      linkedin: "https://linkedin.com/company/cobalt-commerce", contactEmails: ["team@cobaltcommerce.io"],
      phone: "+1 (312) 555-0117", companySize: "50-200", source: "UPWORK",
      notes: "Headless commerce agency. Wants Shopify Hydrogen + Sanity partner.",
      status: "OUTREACH_ACTIVE", locked: true, followUpCount: 1, responseRate: 28,
      createdDaysAgo: 7, lastOutreachHoursAgo: 20, nextFollowUpDaysAhead: 0,
      emails: [
        { subject: "Shopify Hydrogen partner intro", templateIdx: 0, status: "SENT", sentHoursAgo: 20, notes: "Awaiting reply." },
      ],
    },
    {
      id: "c10", name: "Nimbus Cloud", website: "https://nimbuscloud.dev", industry: "Cloud Infrastructure", country: "United States",
      linkedin: "https://linkedin.com/company/nimbus-cloud", contactEmails: ["growth@nimbuscloud.dev"],
      phone: "+1 (206) 555-0188", companySize: "50-200", source: "INBOUND",
      notes: "Developer tools for cloud cost optimization. Wants interactive demo portal.",
      status: "MEETING_SCHEDULED", locked: true, followUpCount: 2, responseRate: 66,
      createdDaysAgo: 9, lastOutreachHoursAgo: 48, nextFollowUpDaysAhead: 2,
      emails: [
        { subject: "Introduction — DevLance x Nimbus", templateIdx: 0, status: "REPLIED", sentHoursAgo: 240 },
      ],
    },
    {
      id: "c11", name: "Forge Mobility", website: "https://forgemobility.eu", industry: "Automotive", country: "Sweden",
      linkedin: "https://linkedin.com/company/forge-mobility", contactEmails: ["partnerships@forgemobility.eu"],
      phone: "+46 8 555 0177", companySize: "200-500", source: "LINKEDIN",
      notes: "EV charging network. Building operator dashboard + consumer app.",
      status: "REPLIED", followUpCount: 3, responseRate: 58,
      createdDaysAgo: 15, lastOutreachHoursAgo: 72, nextFollowUpDaysAhead: 1,
      emails: [
        { subject: "EV dashboard partnership", templateIdx: 0, status: "REPLIED", sentHoursAgo: 168 },
      ],
    },
    {
      id: "c12", name: "Sundara Hospitality", website: "https://sundarahotels.com", industry: "Hospitality", country: "India",
      linkedin: "https://linkedin.com/company/sundara-hospitality", contactEmails: ["it@sundarahotels.com", "ceo@sundarahotels.com"],
      phone: "+91 22 5550 1100", companySize: "1000-5000", source: "REFERRAL",
      notes: "Boutique hotel chain. Direct-booking platform + guest experience app.",
      status: "NOT_CONTACTED", followUpCount: 0, responseRate: 0, createdDaysAgo: 1,
      emails: [],
    },
  ];

  for (const cs of companiesSeed) {
    const company = await prisma.company.create({
      data: {
        id: cs.id,
        name: cs.name,
        website: cs.website,
        industry: cs.industry,
        country: cs.country,
        linkedin: cs.linkedin,
        contactEmails: cs.contactEmails,
        phone: cs.phone,
        companySize: cs.companySize,
        source: cs.source,
        notes: cs.notes,
        createdById: admin.id,
        assignedToId: admin.id,
        status: cs.status,
        locked: cs.locked ?? false,
        lockedById: cs.locked ? admin.id : null,
        lockedAt: cs.locked ? hoursAgo(6) : null,
        lastOutreachAt: cs.lastOutreachHoursAgo ? hoursAgo(cs.lastOutreachHoursAgo) : null,
        nextFollowUpAt: cs.nextFollowUpDaysAhead != null ? daysAhead(cs.nextFollowUpDaysAhead) : null,
        followUpCount: cs.followUpCount,
        responseRate: cs.responseRate,
        createdAt: daysAgo(cs.createdDaysAgo),
      },
    });

    // Emails
    for (const e of cs.emails) {
      const sentAt = hoursAgo(e.sentHoursAgo);
      await prisma.email.create({
        data: {
          companyId: company.id,
          subject: e.subject,
          templateId: templates[e.templateIdx]?.id ?? null,
          senderId: admin.id,
          body: templates[e.templateIdx]?.body ?? "",
          sentAt,
          status: e.status,
          notes: e.notes ?? null,
          attachments: e.attachments ?? [],
        },
      });
    }

    // Activities
    if (cs.locked) {
      await prisma.activity.create({ data: { type: "OUTREACH_STARTED", actorId: admin.id, companyId: company.id, message: `locked ${cs.name} for outreach`, createdAt: hoursAgo(6) } });
    }
    for (const e of cs.emails) {
      const sentAt = hoursAgo(e.sentHoursAgo);
      await prisma.activity.create({ data: { type: "EMAIL_SENT", actorId: admin.id, companyId: company.id, message: `sent "${e.subject}" to ${cs.name}`, createdAt: sentAt, meta: { subject: e.subject } } });
      if (e.status === "REPLIED") {
        await prisma.activity.create({ data: { type: "REPLY_RECEIVED", actorId: admin.id, companyId: company.id, message: `received a reply from ${cs.name}`, createdAt: new Date(sentAt.getTime() + 36_000_000), meta: { from: cs.contactEmails[0] } } });
      }
    }
    await prisma.activity.create({ data: { type: "COMPANY_ADDED", actorId: admin.id, companyId: company.id, message: `added ${cs.name} to the CRM`, createdAt: daysAgo(cs.createdDaysAgo), meta: { source: cs.source } } });
  }

  console.log(`✓ Seeded ${templates.length} templates, ${docs.length} documents, ${companiesSeed.length} companies with emails + activities.`);
  console.log("  All data is owned by admin:", admin.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());