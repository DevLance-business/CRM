import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "text-white bg-brand-gradient shadow-[0_10px_24px_-12px_rgba(37,99,235,0.6)] hover:shadow-[0_16px_32px_-10px_rgba(37,99,235,0.5)] hover:-translate-y-px",
        secondary:
          "bg-white/70 backdrop-blur-md border border-[var(--color-border-subtle)] text-[var(--color-foreground)] hover:border-blue-300 hover:bg-white hover:shadow-soft dark:bg-white/5 dark:hover:bg-white/10",
        ghost:
          "bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[var(--color-foreground)]",
        outline:
          "border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-foreground)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
        danger:
          "text-white bg-gradient-to-br from-rose-500 to-red-600 hover:shadow-[0_16px_32px_-10px_rgba(220,38,38,0.5)] hover:-translate-y-px",
        subtle:
          "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-blue-100 dark:hover:bg-blue-500/20",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px] rounded-[12px]",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 rounded-[12px] p-0",
        "icon-sm": "h-9 w-9 rounded-[10px] p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };

// Plain anchor version for links styled as buttons
export function buttonLinkClass(
  variant: VariantProps<typeof buttonVariants>["variant"] = "primary",
  size: VariantProps<typeof buttonVariants>["size"] = "md",
) {
  return buttonVariants({ variant, size });
}

// Re-export for convenience typing
export type ButtonVariantProps = VariantProps<typeof buttonVariants>;