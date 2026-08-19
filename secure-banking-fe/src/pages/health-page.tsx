import { pingHealth } from "@/api/services.ts";
import { Card } from "@/components/ui/card.tsx";
import { PageHeader, Sparkline } from "@/components/ui/stat-card.tsx";
import { StatusDot } from "@/components/ui/timeline.tsx";
import { services } from "@/mock/seed.ts";
import { useQuery } from "@tanstack/react-query";

export function HealthPage() {
  const gateway = useQuery({ queryKey: ["health"], queryFn: pingHealth });
  return (
    <div>
      <PageHeader
        title="System Health"
        description={`Gateway actuator ${typeof gateway.data === "object" && gateway.data && "status" in gateway.data ? String(gateway.data.status) : "demo"}`}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {services.map((service) => (
          <Card key={service.id} className="min-w-0 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {service.name}
                </p>
                <div className="mt-1">
                  <StatusDot tone="success" label={service.status} />
                </div>
              </div>
              <Sparkline
                values={service.spark}
                color="#14B8A6"
                className="hidden shrink-0 sm:block"
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-ink-3">
              <div>
                Latency{" "}
                <span className="block text-ink">{service.latencyMs} ms</span>
              </div>
              <div>
                Requests{" "}
                <span className="block text-ink">
                  {service.requests.toLocaleString("en-US")}
                </span>
              </div>
              <div>
                Error rate{" "}
                <span className="block text-ink">
                  {service.errorRate.toFixed(2)}%
                </span>
              </div>
              <div>
                Availability{" "}
                <span className="block text-ink">
                  {service.availability.toFixed(2)}%
                </span>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
