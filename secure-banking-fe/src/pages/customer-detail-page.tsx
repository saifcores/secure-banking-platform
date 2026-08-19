import { getCustomer, listAccounts, listTransactions } from "@/api/services.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardHeader } from "@/components/ui/card.tsx";
import { ErrorState } from "@/components/ui/feedback.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Breadcrumb, PageHeader } from "@/components/ui/stat-card.tsx";
import { Tabs, TableWrap, Td, Th } from "@/components/ui/table.tsx";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import {
  formatAmount,
  formatDateTime,
  maskAccount,
  tenantLabel,
} from "@/lib/format.ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

export function CustomerDetailPage() {
  const { id = "" } = useParams();
  const mode = useLiveMode();
  const [tab, setTab] = useState("profile");
  const customer = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomer(id, mode),
  });
  const accounts = useQuery({
    queryKey: ["accounts", mode.tenantId],
    queryFn: () => listAccounts(mode),
  });
  const txs = useQuery({
    queryKey: ["transactions", mode.tenantId],
    queryFn: () => listTransactions(mode),
  });
  const c = customer.data;
  const owned = (accounts.data ?? []).filter((a) => a.customerId === id);

  if (customer.isLoading) return <Skeleton className="h-64" />;
  if (!c) return <ErrorState title="Customer not found" />;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Customers", href: "/customers" },
          { label: `${c.firstName} ${c.lastName}` },
        ]}
      />
      <PageHeader
        title={`${c.firstName} ${c.lastName}`}
        description={`${c.email} · ${tenantLabel(c.tenantId)}`}
        actions={<Badge status={c.status}>{c.status}</Badge>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "accounts", label: "Accounts" },
          { id: "transactions", label: "Transactions" },
          { id: "activity", label: "Activity" },
          { id: "security", label: "Security" },
        ]}
      />
      {tab === "profile" ? (
        <Card className="mt-4 grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Customer ID" value={c.id} mono />
          <Field label="Keycloak user" value={c.keycloakUserId} mono />
          <Field label="Phone" value={c.phone} />
          <Field label="Created" value={formatDateTime(c.createdAt)} />
        </Card>
      ) : null}
      {tab === "accounts" ? (
        <Card className="mt-4">
          <TableWrap>
            <thead>
              <tr>
                <Th>Account</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {owned.map((a) => (
                <tr key={a.id}>
                  <Td mono>
                    <Link to={`/accounts/${a.id}`}>{a.accountNumber}</Link>
                  </Td>
                  <Td className="font-semibold text-ink">
                    {formatAmount(a.balance, a.currency)}
                  </Td>
                  <Td>
                    <Badge status={a.status}>{a.status}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      ) : null}
      {tab === "transactions" ? (
        <Card className="mt-4">
          <TableWrap>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {(txs.data ?? [])
                .filter((t) =>
                  owned.some(
                    (a) =>
                      a.accountNumber === t.sourceAccount ||
                      a.accountNumber === t.destinationAccount,
                  ),
                )
                .slice(0, 10)
                .map((t) => (
                  <tr key={t.id}>
                    <Td mono>
                      <Link to={`/transactions/${t.id}`}>{t.reference}</Link>
                    </Td>
                    <Td>{formatAmount(t.amount, t.currency)}</Td>
                    <Td>
                      <Badge status={t.status}>{t.status}</Badge>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </TableWrap>
        </Card>
      ) : null}
      {tab === "activity" ? (
        <Card className="mt-4 p-5 text-sm text-ink-2">
          Profile updates, logins and transfers are recorded in audit.
        </Card>
      ) : null}
      {tab === "security" ? (
        <Card className="mt-4">
          <CardHeader title="Security" />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <Field label="Authentication" value="OAuth2 / OIDC" />
            <Field label="Tenant isolation" value={tenantLabel(c.tenantId)} />
            <Field
              label="Masked accounts"
              value={owned.map((a) => maskAccount(a.accountNumber)).join(" · ")}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </p>
      <p
        className={
          mono
            ? "mono mt-1 break-all text-sm text-ink"
            : "mt-1 break-words text-sm text-ink"
        }
      >
        {value}
      </p>
    </div>
  );
}
