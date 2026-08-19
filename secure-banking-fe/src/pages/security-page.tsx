import { Card } from "@/components/ui/card.tsx";
import { PageHeader, StatCard } from "@/components/ui/stat-card.tsx";
import { StatusDot } from "@/components/ui/timeline.tsx";
import { securityEvents } from "@/mock/seed.ts";
import { KeyRound, Lock, Shield, ShieldCheck, Users } from "lucide-react";

const health = [
  { label: "Authentication", value: "Healthy", icon: Lock },
  { label: "Authorization", value: "Healthy", icon: ShieldCheck },
  { label: "Keycloak", value: "Connected", icon: KeyRound },
  { label: "JWT Validation", value: "Healthy", icon: Shield },
  { label: "Tenant Isolation", value: "Protected", icon: Users },
];

export function SecurityPage() {
  return (
    <div>
      <PageHeader
        title="Security Center"
        description="Identity, authorization and tenant isolation posture"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {health.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={item.icon}
            hint="OAuth2 resource server"
          />
        ))}
      </div>
      <Card className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold">Security activity</h2>
        <ol className="space-y-4">
          {securityEvents.map((event) => (
            <li key={event.id} className="flex min-w-0 gap-4">
              <span className="mono w-12 shrink-0 pt-0.5 text-xs text-ink-3">
                {event.time}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm text-ink">
                  <StatusDot tone={event.tone} />
                  <span className="min-w-0 break-words">{event.title}</span>
                </p>
                <p className="mono break-all text-xs text-ink-3">
                  {event.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
