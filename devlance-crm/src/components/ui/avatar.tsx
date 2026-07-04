import { forwardRef, type HTMLAttributes } from "react";
import { cn, initials } from "@/lib/utils";
import { statusColor } from "@/lib/store";
import type { CompanyStatus, User } from "@/lib/types";
import { Badge } from "./badge";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
}

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, color = "from-blue-500 to-sky-400", size = "md", online, className, ...props }, ref) => (
    <div ref={ref} className={cn("relative shrink-0", className)} {...props}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white bg-gradient-to-br",
          color,
          sizes[size],
        )}
      >
        {initials(name)}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-[color:var(--color-background)]",
            online ? "bg-emerald-500" : "bg-slate-400",
            size === "xs" ? "h-2 w-2" : "h-2.5 w-2.5",
          )}
        />
      )}
    </div>
  ),
);
Avatar.displayName = "Avatar";

export function AvatarGroup({ users, max = 4, size = "sm" }: { users: User[]; max?: number; size?: AvatarProps["size"] }) {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u) => (
        <div key={u.id} className="ring-2 ring-white dark:ring-[color:var(--color-background)] rounded-full">
          <Avatar name={u.name} color={u.avatarColor} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "ring-2 ring-white dark:ring-[color:var(--color-background)] rounded-full flex items-center justify-center font-semibold text-slate-600 bg-slate-100 dark:bg-white/10 dark:text-slate-300",
            sizes[size ?? "sm"],
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: CompanyStatus; className?: string }) {
  const c = statusColor(status);
  return (
    <Badge
      variant="outline"
      dot
      dotColor={c}
      className={cn("font-medium", className)}
    >
      <span style={{ color: c }}>{status}</span>
    </Badge>
  );
}