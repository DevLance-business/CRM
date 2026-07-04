"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { signupAdmin, type SignupState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signupAdmin, undefined);
  const [showPw, setShowPw] = useState(false);

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
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Create admin account
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted-foreground)]">
          You&apos;ll invite team members from inside the app
        </p>
      </div>

      {/* Card */}
      <div className="glass rounded-[20px] p-5 shadow-[var(--shadow-soft)]">
        <form action={formAction} className="space-y-3">
          <div>
            <label htmlFor="workspace" className="mb-1 block text-[12.5px] font-semibold">
              Workspace name
            </label>
            <Input id="workspace" name="workspace" placeholder="DevLance HQ" required />
          </div>

          <div>
            <label htmlFor="name" className="mb-1 block text-[12.5px] font-semibold">
              Your name
            </label>
            <Input id="name" name="name" autoComplete="name" placeholder="Aarav Mehta" required />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-[12.5px] font-semibold">
              Work email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="aarav@devlance.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-[12.5px] font-semibold">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] text-slate-400 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Create admin account
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-[12.5px] text-[var(--color-muted-foreground)]">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}