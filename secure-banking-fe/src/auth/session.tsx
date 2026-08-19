import { setTokenProvider } from "@/api/client.ts";
import {
  initKeycloak,
  keycloak,
  loginWithKeycloak,
  logoutKeycloak,
} from "@/auth/keycloak.ts";
import { permissionsFor } from "@/lib/rbac.ts";
import { DEMO_USER } from "@/mock/seed.ts";
import { DEMO_ROLES } from "@/mock/store.ts";
import type { Role, SessionUser, TenantId } from "@/types/domain.ts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const DEMO_KEY = "sbp.demo-session";

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  isDemo: boolean;
  login: () => Promise<void>;
  loginDemo: (role?: Role) => void;
  logout: () => Promise<void>;
  switchDemoRole: (role: Role) => void;
  setTenant: (tenantId: TenantId) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readDemo(): SessionUser | null {
  const raw = sessionStorage.getItem(DEMO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function persistDemo(user: SessionUser | null) {
  if (!user) sessionStorage.removeItem(DEMO_KEY);
  else sessionStorage.setItem(DEMO_KEY, JSON.stringify(user));
}

function demoUser(role: Role = "ADMIN"): SessionUser {
  const preset = DEMO_ROLES.find((r) => r.role === role) ?? DEMO_ROLES[0];
  return {
    id: DEMO_USER.id,
    username: role === "CUSTOMER" ? "awa.diop" : DEMO_USER.username,
    email: role === "CUSTOMER" ? "awa.diop@bank-dakar.local" : DEMO_USER.email,
    firstName: role === "CUSTOMER" ? "Awa" : DEMO_USER.firstName,
    lastName: role === "CUSTOMER" ? "Diop" : DEMO_USER.lastName,
    role,
    roles: [role],
    tenantId: preset.tenantId,
    permissions: permissionsFor([role]),
    tokenParsed: {
      sub: DEMO_USER.id,
      preferred_username: role === "CUSTOMER" ? "awa.diop" : "diallo",
      tenant_id: preset.tenantId,
      roles: [role],
      iss: "http://localhost:8085/realms/banking",
      azp: "banking-frontend",
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
  };
}

function fromKeycloak(): SessionUser | null {
  if (!keycloak.authenticated || !keycloak.tokenParsed) return null;
  const parsed = keycloak.tokenParsed as Record<string, unknown>;
  const realmAccess = parsed.realm_access as { roles?: string[] } | undefined;
  const roles = (realmAccess?.roles ?? []).filter((role): role is Role =>
    ["CUSTOMER", "OPERATOR", "SUPPORT", "AUDITOR", "ADMIN", "SERVICE"].includes(
      role,
    ),
  );
  const role = roles.includes("ADMIN") ? "ADMIN" : (roles[0] ?? "CUSTOMER");
  const tenantId = (
    typeof parsed.tenant_id === "string" ? parsed.tenant_id : "BANK_DAKAR"
  ) as TenantId;
  return {
    id: String(parsed.sub ?? "unknown"),
    username: String(parsed.preferred_username ?? "user"),
    email: String(parsed.email ?? ""),
    firstName: String(parsed.given_name ?? parsed.preferred_username ?? "User"),
    lastName: String(parsed.family_name ?? ""),
    role,
    roles: roles.length ? roles : [role],
    tenantId,
    permissions: permissionsFor(roles.length ? roles : [role]),
    token: keycloak.token,
    tokenParsed: parsed,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readDemo);
  const [ready, setReady] = useState(false);
  const [isDemo, setIsDemo] = useState(() => Boolean(readDemo()));

  useEffect(() => {
    setTokenProvider(() => user?.token);
  }, [user]);

  useEffect(() => {
    if (readDemo()) {
      setReady(true);
      return;
    }
    initKeycloak()
      .then((authenticated) => {
        if (authenticated) {
          setUser(fromKeycloak());
          setIsDemo(false);
        }
      })
      .catch(() => {
        /* Keycloak unavailable — demo login remains available */
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async () => {
    await loginWithKeycloak();
  }, []);

  const loginDemo = useCallback((role: Role = "ADMIN") => {
    const next = demoUser(role);
    persistDemo(next);
    setIsDemo(true);
    setUser(next);
  }, []);

  const logout = useCallback(async () => {
    persistDemo(null);
    setUser(null);
    setIsDemo(false);
    if (keycloak.authenticated) {
      await logoutKeycloak();
    }
  }, []);

  const switchDemoRole = useCallback((role: Role) => {
    const next = demoUser(role);
    persistDemo(next);
    setIsDemo(true);
    setUser(next);
  }, []);

  const setTenant = useCallback(
    (tenantId: TenantId) => {
      setUser((current) => {
        if (!current) return current;
        const next = { ...current, tenantId };
        if (isDemo) persistDemo(next);
        return next;
      });
    },
    [isDemo],
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      isDemo,
      login,
      loginDemo,
      logout,
      switchDemoRole,
      setTenant,
    }),
    [user, ready, isDemo, login, loginDemo, logout, switchDemoRole, setTenant],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
