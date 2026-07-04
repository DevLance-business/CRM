import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AmbientBackground } from "@/components/ambient-background";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevLance CRM — Agency Outreach OS",
  description:
    "DevLance internal operating system for agency outreach, client tracking, and business development.",
  icons: {
    icon: [
      { url: "/devlancelogo.jpeg", type: "image/jpeg" },
    ],
    shortcut: [{ url: "/devlancelogo.jpeg", type: "image/jpeg" }],
    apple: [{ url: "/devlancelogo.jpeg", type: "image/jpeg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body
        className={`${inter.variable} ${jakarta.variable} min-h-full`}
      >
        <Providers>
          <AmbientBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}