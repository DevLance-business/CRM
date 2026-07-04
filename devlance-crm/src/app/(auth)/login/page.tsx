"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, undefined);
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
          Welcome back
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted-foreground)]">
          Sign in to the DevLance workspace
        </p>
      </div>

      {/* Card */}
      <div className="glass rounded-[20px] p-5 shadow-[var(--shadow-soft)]">
        <form action={formAction} className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-[12.5px] font-semibold">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@devlance.com"
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
                autoComplete="current-password"
                placeholder="••••••••"
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

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Sign in
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-4 text-center text-[12.5px] text-[var(--color-muted-foreground)]">
        Need an admin account?{" "}
        <Link href="/signup" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}