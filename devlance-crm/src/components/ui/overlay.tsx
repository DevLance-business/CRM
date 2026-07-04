import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "right" | "left";
  width?: string;
  label?: string;
}

export function Drawer({ open, onClose, children, side = "right", width = "max-w-md", label }: OverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-label={label}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className={cn(
              "absolute top-0 bottom-0 w-full glass border-0 border-l",
              "rounded-none",
              side === "right" ? "right-0" : "left-0",
              width,
            )}
            style={{ maxWidth: "92vw" }}
          >
            {children}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-[10px] bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Modal({
  open,
  onClose,
  children,
  size = "max-w-lg",
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: string;
  label?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={cn("relative w-full glass rounded-[24px] p-6 shadow-[var(--shadow-hover)]", size)}
            style={{ maxWidth: "92vw" }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-[10px] bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}