import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}