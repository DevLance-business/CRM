import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  onPage,
  className,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, start + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--color-border-subtle)] text-slate-500 hover:bg-black/[0.04] dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={cn(
            "h-9 min-w-9 px-3 rounded-[10px] text-sm font-semibold transition-all duration-200",
            p === page
              ? "bg-brand-gradient text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.6)]"
              : "border border-[var(--color-border-subtle)] text-slate-600 hover:bg-black/[0.04] dark:text-slate-300 dark:hover:bg-white/10",
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--color-border-subtle)] text-slate-500 hover:bg-black/[0.04] dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}