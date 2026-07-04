import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export default async function Home() {
  const userId = await getSessionUserId();
  if (userId) redirect("/dashboard");

  const admin = await prisma.workspaceMeta.findFirst().catch(() => null);
  redirect(admin ? "/login" : "/signup");
}