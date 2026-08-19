import { useAuth } from "@/auth/session.tsx";

export function useLiveMode() {
  const { user, isDemo } = useAuth();
  const tenantId = user?.tenantId ?? "BANK_DAKAR";
  return {
    live: !isDemo && Boolean(user?.token),
    tenantId,
    isPlatform: tenantId === "PLATFORM" || user?.role === "ADMIN",
  };
}
