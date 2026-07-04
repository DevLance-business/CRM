import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-white/60 dark:bg-white/5",
        "px-3.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]",
        "backdrop-blur-md transition-all duration-200",
        "focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-white/60 dark:bg-white/5",
        "px-3.5 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]",
        "backdrop-blur-md transition-all duration-200 resize-none",
        "focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[13px] font-semibold text-[var(--color-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">{hint}</p>}
    </div>
  );
}

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-white/60 dark:bg-white/5",
        "px-3 text-sm text-[var(--color-foreground)] backdrop-blur-md transition-all duration-200",
        "focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";