"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Password updated — sign in to continue");
      router.push("/login");
    }, 800);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/devlancelogo.jpeg"
          alt="DevLance"
          width={56}
          height={56}
          className="mb-3 rounded-[14px] shadow-[0_10px_24px_-10px_rgba(37,99,235,0.5)]"
          priority
        />
        <h1 className="font-display text-2xl font-extrabold tracking-tight">New password</h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted-foreground)]">
          Choose a strong password for your account
        </p>
      </div>

      <div className="glass rounded-[20px] p-5 shadow-[var(--shadow-soft)]">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="password" className="mb-1 block text-[12.5px] font-semibold">
              New password
            </label>
            <Input id="password" type="password" required minLength={8} placeholder="••••••••" />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-[12.5px] font-semibold">
              Confirm password
            </label>
            <Input id="confirm" type="password" required minLength={8} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Updating…
              </>
            ) : (
              <>
                Update password <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-[12.5px] text-[var(--color-muted-foreground)]">
        <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}