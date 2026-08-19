import { useAuth } from "@/auth/session.tsx";
import { Button } from "@/components/ui/button.tsx";
import { DEMO_ROLES } from "@/mock/store.ts";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@/types/domain.ts";

const chips = ["OAuth2", "OIDC", "JWT", "RBAC", "Multi-Tenant"];

export function LoginPage() {
  const { user, login, loginDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("ADMIN");

  if (user) return <Navigate to="/overview" replace />;

  async function onKeycloak() {
    setLoading(true);
    setError(null);
    try {
      await login();
    } catch {
      setError("Keycloak is unreachable. Continue in the demo environment.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-radial-fade bg-grid relative flex h-full items-center justify-center overflow-y-auto px-4 py-8">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {chips.map((chip, i) => (
          <span
            key={chip}
            className="absolute font-mono text-[11px] tracking-[0.22em] text-white/15"
            style={{
              top: `${18 + i * 14}%`,
              left: i % 2 === 0 ? "8%" : "auto",
              right: i % 2 === 1 ? "9%" : "auto",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="relative mx-auto w-full max-w-[440px] rounded-lg border border-white/10 bg-surface/90 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md border border-accent/30 bg-accent/10">
            <Shield className="size-5 text-accent" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Enterprise console
            </p>
            <p className="text-sm font-semibold text-ink">
              Secure Banking Platform
            </p>
          </div>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.045em] text-ink sm:text-[28px]">
          Enterprise Banking Infrastructure
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          Secure. Observable. Multi-tenant.
        </p>
        <div className="mt-8 space-y-3">
          <Button
            className="w-full"
            size="lg"
            loading={loading}
            onClick={() => void onKeycloak()}
          >
            Continue with Keycloak
          </Button>
          <p className="flex items-center justify-center gap-2 text-[12px] text-ink-3">
            <span className="size-1.5 rounded-full bg-success" />
            Secure authentication
          </p>
        </div>
        {error ? (
          <p className="mt-4 text-center text-sm text-warning">{error}</p>
        ) : null}
        <div className="mt-8 border-t border-white/8 pt-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-ink-3">
            Demo environment
          </p>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mb-3 h-9 w-full rounded-md border border-white/10 bg-navy-2 px-3 text-sm"
          >
            {DEMO_ROLES.map((item) => (
              <option key={item.role} value={item.role}>
                {item.label}
              </option>
            ))}
          </select>
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => loginDemo(role)}
          >
            Explore as {role}
          </Button>
          <p className="mt-3 text-center font-mono text-[11px] text-ink-3">
            Authorization Code + PKCE · banking-frontend
          </p>
        </div>
      </div>
    </div>
  );
}
