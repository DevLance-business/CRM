import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-[var(--color-muted-foreground)]">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}