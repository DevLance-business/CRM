"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success("Reset link sent");
    }, 800);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Brand */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/devlancelogo.jpeg"
          alt="DevLance"
          width={56}
          height={56}
          className="mb-3 rounded-[14px] shadow-[0_10px_24px_-10px_rgba(37,99,235,0.5)]"
          priority
        />
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Reset password</h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted-foreground)]">
          {sent ? "Check your inbox for the reset link." : "We'll email you a secure link to reset it."}
        </p>
      </div>

      <div className="glass rounded-[20px] p-5 shadow-[var(--shadow-soft)]">
        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <Button className="w-full" onClick={() => router.push("/reset-password")}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="email" className="mb-1 block text-[12.5px] font-semibold">
                Work email
              </label>
              <Input id="email" type="email" required placeholder="you@devlance.com" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  Send reset link <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      <p className="mt-4 text-center text-[12.5px] text-[var(--color-muted-foreground)]">
        <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}