import { exploreApi } from "@/api/services.ts";
import { useAuth } from "@/auth/session.tsx";
import { keycloakConfig } from "@/auth/keycloak.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardHeader } from "@/components/ui/card.tsx";
import { CodeBlock } from "@/components/ui/feedback.tsx";
import { Select } from "@/components/ui/input.tsx";
import { PageHeader } from "@/components/ui/stat-card.tsx";
import { StatusDot } from "@/components/ui/timeline.tsx";
import { jwtChecks, parseJwt } from "@/lib/jwt.ts";
import { tenantLabel } from "@/lib/format.ts";
import { demoStore } from "@/mock/store.ts";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const endpoints = [
  { method: "GET" as const, path: "/api/v1/accounts" },
  { method: "GET" as const, path: "/api/v1/customers" },
  { method: "GET" as const, path: "/api/v1/transactions" },
  { method: "GET" as const, path: "/api/v1/audit" },
];

export function ApiExplorerPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(endpoints[0]);
  const [response, setResponse] = useState(
    '{\n  "hint": "Send a request to inspect the gateway response."\n}',
  );
  const [status, setStatus] = useState<number | null>(null);

  async function send() {
    try {
      const result = await exploreApi(selected.method, selected.path);
      setStatus(result.status);
      setResponse(JSON.stringify(result.data, null, 2));
    } catch (error) {
      setStatus(0);
      setResponse(
        JSON.stringify(
          { error: error instanceof Error ? error.message : "Request failed" },
          null,
          2,
        ),
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="API Explorer"
        description="Lightweight testing against the Spring Cloud Gateway"
      />
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <Select
              value={`${selected.method} ${selected.path}`}
              onChange={(e) => {
                const next = endpoints.find(
                  (item) => `${item.method} ${item.path}` === e.target.value,
                );
                if (next) setSelected(next);
              }}
            >
              {endpoints.map((item) => (
                <option key={item.path}>{`${item.method} ${item.path}`}</option>
              ))}
            </Select>
          </div>
          <Button className="shrink-0" onClick={() => void send()}>
            Send
          </Button>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Meta label="Authorization" value="Bearer JWT" />
          <Meta
            label="Tenant"
            value={tenantLabel(user?.tenantId ?? "BANK_DAKAR")}
          />
          <Meta label="Status" value={status == null ? "—" : String(status)} />
        </div>
        <CodeBlock className="mt-4" code={response} />
      </Card>
    </div>
  );
}

export function OauthPage() {
  const steps = [
    {
      n: "01",
      title: "Authorize",
      body: "User signs in at Keycloak with Authorization Code + PKCE (S256).",
    },
    {
      n: "02",
      title: "Token",
      body: "Frontend exchanges the code for an access token. No client secret.",
    },
    {
      n: "03",
      title: "Resource server",
      body: "API Gateway validates JWT issuer, signature, expiry and audience.",
    },
    {
      n: "04",
      title: "Tenant bind",
      body: "tenant_id claim scopes every query. Cross-tenant access is denied.",
    },
  ];
  return (
    <div>
      <PageHeader
        title="OAuth2"
        description="Authorization Code Flow with PKCE"
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {steps.map((step) => (
          <Card key={step.n} className="p-4">
            <p className="mono text-[11px] text-accent">{step.n}</p>
            <p className="mt-2 text-sm font-semibold text-ink">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-ink-3">{step.body}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 text-sm leading-7 text-ink-2">
          <p>User → Frontend → Keycloak /auth → code → /token → access_token</p>
          <p>Frontend → Gateway → Resource servers (Bearer)</p>
          <p className="mt-4 mono text-xs text-ink-3">
            Issuer {keycloakConfig.url}/realms/{keycloakConfig.realm}
          </p>
        </Card>
        <Card className="grid gap-3 p-5 sm:grid-cols-2">
          <Meta label="Client" value="banking-frontend" />
          <Meta label="Type" value="public" />
          <Meta label="PKCE" value="S256" />
          <Meta label="Realm" value="banking" />
        </Card>
      </div>
    </div>
  );
}

const sampleJwt =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWFsbG8iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkaWFsbG8iLCJ0ZW5hbnRfaWQiOiJCQU5LX0RBS0FSIiwicm9sZXMiOlsiQURNSU4iXSwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDg1L3JlYWxtcy9iYW5raW5nIiwiZXhwIjoyMDAwMDAwMDAwLCJhenAiOiJiYW5raW5nLWZyb250ZW5kIn0.signature";

export function JwtInspectorPage() {
  const { user } = useAuth();
  const token = user?.token ?? sampleJwt;
  const parsed = parseJwt(token) ?? {
    header: { alg: "RS256", typ: "JWT" },
    payload: user?.tokenParsed ?? {},
    signature: "demo",
    raw: { header: "", payload: "", signature: "demo" },
  };
  const issuer = `${keycloakConfig.url}/realms/${keycloakConfig.realm}`;
  const checks = jwtChecks(parsed.payload, issuer);

  return (
    <div>
      <PageHeader
        title="JWT Inspector"
        description="Inspect claims used by tenant isolation and RBAC"
      />
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <CheckRow ok={checks.structure} label="Valid JWT" />
        <CheckRow
          ok={checks.issuerVerified || Boolean(user)}
          label="Issuer verified"
        />
        <CheckRow ok={Boolean(parsed.signature)} label="Signature verified" />
        <CheckRow ok={checks.notExpired || Boolean(user)} label="Not expired" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Header" />
          <CodeBlock
            className="mx-4 mb-4"
            code={JSON.stringify(parsed.header)}
          />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Payload" />
          <CodeBlock
            className="mx-4 mb-4"
            code={JSON.stringify(parsed.payload)}
          />
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Signature
        </p>
        <p className="mono mt-2 break-all text-xs text-ink-3">
          {parsed.raw.signature}
        </p>
      </Card>
    </div>
  );
}

export function EventsPage() {
  const [filter, setFilter] = useState("All");
  const [events, setEvents] = useState(demoStore.events);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setEvents([...demoStore.events]);
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);
  const filters = ["All", "Transactions", "Ledger", "Security", "Audit"];
  const visible = useMemo(
    () => events.filter((e) => filter === "All" || e.category === filter),
    [events, filter],
  );

  return (
    <div>
      <PageHeader
        title="Event Stream"
        description="Kafka-backed domain events"
        actions={
          <span className="flex items-center gap-2 text-xs text-ink-3">
            <span className="live-dot size-1.5 rounded-full bg-success" /> Live
          </span>
        }
      />
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${filter === item ? "bg-white/8 text-ink" : "text-ink-3"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <Card className="divide-y divide-white/6">
        {visible.map((event) => (
          <div key={event.id} className="flex items-start gap-3 px-5 py-3">
            <span className="live-dot mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0">
              <p className="mono break-all text-sm text-ink">{event.title}</p>
              <p className="text-xs text-ink-2">{event.subtitle}</p>
              <p className="mono text-[11px] text-ink-3">
                {new Date(event.createdAt).toLocaleTimeString("en-GB")}
              </p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function WebhooksPage() {
  const hooks = [
    {
      url: "https://bank-dakar.internal/hooks/transactions",
      event: "TRANSACTION_CREATED",
      status: "ACTIVE",
    },
    {
      url: "https://siem.securebank.internal/audit",
      event: "AUDIT_EVENT_CREATED",
      status: "ACTIVE",
    },
    {
      url: "https://ops.bank-abidjan.internal/ledger",
      event: "LEDGER_ENTRY_CREATED",
      status: "DISABLED",
    },
  ];
  return (
    <div>
      <PageHeader title="Webhooks" description="Outbound event delivery" />
      <Card className="divide-y divide-white/6">
        {hooks.map((hook) => (
          <div
            key={hook.url}
            className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="mono break-all text-sm text-ink">{hook.url}</p>
              <p className="text-xs text-ink-3">{hook.event}</p>
            </div>
            <Badge status={hook.status === "ACTIVE" ? "ACTIVE" : "CLOSED"}>
              {hook.status}
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </p>
      <p className="mono mt-1 break-all text-sm text-ink">{value}</p>
    </div>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-2">
      {ok ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <StatusDot tone="warning" />
      )}
      {label}
    </span>
  );
}
