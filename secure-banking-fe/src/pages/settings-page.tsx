import { useAuth } from "@/auth/session.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardHeader } from "@/components/ui/card.tsx";
import { Input, Select } from "@/components/ui/input.tsx";
import { PageHeader } from "@/components/ui/stat-card.tsx";
import { Tabs } from "@/components/ui/table.tsx";
import { DEMO_ROLES } from "@/mock/store.ts";
import { tenantLabel } from "@/lib/format.ts";
import type { Role } from "@/types/domain.ts";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsPage() {
  const { user, isDemo, switchDemoRole } = useAuth();
  const [tab, setTab] = useState("profile");
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Profile, security and workspace preferences"
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "security", label: "Security" },
          { id: "tenant", label: "Tenant" },
          { id: "notifications", label: "Notifications" },
          { id: "api", label: "API" },
          { id: "preferences", label: "Preferences" },
        ]}
      />
      {tab === "profile" ? (
        <Card className="mt-4 grid gap-4 p-5 sm:grid-cols-2">
          <Input label="First name" defaultValue={user.firstName} />
          <Input label="Last name" defaultValue={user.lastName} />
          <Input label="Email" defaultValue={user.email} />
          <Input label="Username" defaultValue={user.username} mono />
          <div className="sm:col-span-2">
            <Button onClick={() => toast.success("Changes saved")}>Save</Button>
          </div>
        </Card>
      ) : null}
      {tab === "security" ? (
        <Card className="mt-4">
          <CardHeader title="Security" />
          <dl className="grid gap-4 px-5 pb-5 sm:grid-cols-2 text-sm">
            <Row label="Authentication Provider" value="Keycloak" />
            <Row label="MFA" value="Enabled" />
            <Row label="Active Sessions" value="3" />
            <Row label="Last Login" value="19 Aug 2026" />
          </dl>
        </Card>
      ) : null}
      {tab === "tenant" ? (
        <Card className="mt-4 p-5">
          <p className="text-sm text-ink-2">
            Current tenant is bound from the JWT `tenant_id` claim.
          </p>
          <p className="mt-2 font-semibold">{tenantLabel(user.tenantId)}</p>
          {isDemo ? (
            <div className="mt-4 max-w-sm">
              <Select
                label="Explore as role"
                value={user.role}
                onChange={(e) => switchDemoRole(e.target.value as Role)}
              >
                {DEMO_ROLES.map((role) => (
                  <option key={role.role} value={role.role}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </Card>
      ) : null}
      {tab === "notifications" ? (
        <Card className="mt-4 p-5 text-sm text-ink-2">
          Failed transfers, access denials and health degradations.
        </Card>
      ) : null}
      {tab === "api" ? (
        <Card className="mt-4 p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3">
            Gateway
          </p>
          <p className="mono mt-1 text-sm">http://localhost:8080/api/v1</p>
        </Card>
      ) : null}
      {tab === "preferences" ? (
        <Card className="mt-4 p-5 text-sm text-ink-2">
          Dense tables, XOF first, 24h timestamps.
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-3">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}
