import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rounded-[12px]", className)} {...props} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16 rounded-[20px] glass",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-[20px] bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-[var(--color-foreground)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--color-muted-foreground)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}