"use client";

import { useEffect } from "react";
import { getCurrentUser } from "@/app/actions/auth";
import { useAuthStore } from "@/lib/store";

/**
 * Reads the signed session on app mount and hydrates the auth store
 * with the real logged-in user (or keeps the default mock for demo).
 */
export function SessionHydrator() {
  const hydrateUser = useAuthStore((s) => s.hydrateUser);

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((u) => {
        if (mounted) hydrateUser(u);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [hydrateUser]);

  return null;
}