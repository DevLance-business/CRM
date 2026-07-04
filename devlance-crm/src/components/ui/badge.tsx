import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
        violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
        outline:
          "border border-[var(--color-border-subtle)] text-[var(--color-muted-foreground)] bg-transparent",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ className, variant, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor ?? "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };