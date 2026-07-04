"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabsCtx = { value: string; setValue: (v: string) => void; variant: "pill" | "underline" };
const Ctx = createContext<TabsCtx | null>(null);

type State = { value: string };
type Action = { type: "set"; value: string };

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = "pill",
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  variant?: "pill" | "underline";
  className?: string;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer((s: State, a: Action) => {
    if (a.type === "set") {
      onValueChange?.(a.value);
      return { value: a.value };
    }
    return s;
  }, { value: value ?? defaultValue ?? "" });

  return (
    <Ctx.Provider value={{ value: value ?? state.value, setValue: (v) => dispatch({ type: "set", value: v }), variant }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const ctx = useContext(Ctx)!;
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        ctx.variant === "pill" && "rounded-full bg-black/[0.04] dark:bg-white/[0.06] p-1",
        ctx.variant === "underline" && "border-b border-[var(--color-border-subtle)] gap-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(Ctx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={cn(
        "relative text-sm font-semibold transition-colors duration-200 focus:outline-none",
        ctx.variant === "pill" && "rounded-full px-4 py-1.5",
        ctx.variant === "underline" && "pb-3 pt-1.5 -mb-px",
        active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
        className,
      )}
    >
      {active && ctx.variant === "pill" && (
        <span className="absolute inset-0 rounded-full bg-white shadow-[0_4px_14px_-6px_rgba(37,99,235,0.4)] dark:bg-white/10" />
      )}
      {active && ctx.variant === "underline" && (
        <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-brand-gradient" />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(Ctx)!;
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}