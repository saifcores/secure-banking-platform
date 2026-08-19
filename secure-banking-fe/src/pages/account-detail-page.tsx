import { getAccount, listCustomers, listTransactions } from "@/api/services.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Card } from "@/components/ui/card.tsx";
import { ErrorState } from "@/components/ui/feedback.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Breadcrumb, PageHeader } from "@/components/ui/stat-card.tsx";
import { TableWrap, Tabs, Td, Th } from "@/components/ui/table.tsx";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import {
  formatAmount,
  formatDateTime,
  maskAccount,
  tenantLabel,
} from "@/lib/format.ts";
import { demoStore } from "@/mock/store.ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

export function AccountDetailPage() {
  const { id = "" } = useParams();
  const mode = useLiveMode();
  const [tab, setTab] = useState("overview");
  const account = useQuery({
    queryKey: ["account", id],
    queryFn: () => getAccount(id, mode),
  });
  const customers = useQuery({
    queryKey: ["customers", mode.tenantId],
    queryFn: () => listCustomers(mode),
  });
  const txs = useQuery({
    queryKey: ["transactions", mode.tenantId],
    queryFn: () => listTransactions(mode),
  });
  const a = account.data;
  const customer = customers.data?.find((c) => c.id === a?.customerId);
  const related = (txs.data ?? []).filter(
    (t) =>
      t.sourceAccount === a?.accountNumber ||
      t.destinationAccount === a?.accountNumber,
  );
  const ledger = demoStore.ledger.filter(
    (e) => e.accountNumber === a?.accountNumber,
  );

  if (account.isLoading) return <Skeleton className="h-64" />;
  if (!a) return <ErrorState title="Account not found" />;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Accounts", href: "/accounts" },
          { label: a.accountNumber },
        ]}
      />
      <PageHeader
        kicker="Account"
        title={a.accountNumber}
        description={`${tenantLabel(a.tenantId)} · ${maskAccount(a.accountNumber)}`}
        actions={<Badge status={a.status}>{a.status}</Badge>}
      />
      <p className="mb-6 break-all text-2xl font-semibold tracking-[-0.05em] tabular text-ink sm:text-4xl">
        {formatAmount(a.balance, a.currency)}
      </p>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Account Overview" },
          { id: "balance", label: "Balance" },
          { id: "history", label: "Transaction history" },
          { id: "ledger", label: "Ledger" },
          { id: "customer", label: "Customer" },
          { id: "security", label: "Security" },
        ]}
      />
      {tab === "overview" || tab === "balance" ? (
        <Card className="mt-4 grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Currency" value={a.currency} />
          <Field label="Opened" value={formatDateTime(a.createdAt)} />
          <Field label="Last activity" value={formatDateTime(a.updatedAt)} />
        </Card>
      ) : null}
      {tab === "history" ? (
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
              {related.map((t) => (
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
      {tab === "ledger" ? (
        <Card className="mt-4">
          <TableWrap>
            <thead>
              <tr>
                <Th>Entry</Th>
                <Th>Type</Th>
                <Th>Debit</Th>
                <Th>Credit</Th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.id}>
                  <Td mono>{e.entryId}</Td>
                  <Td>
                    <Badge
                      tone={e.entryType === "DEBIT" ? "warning" : "success"}
                    >
                      {e.entryType}
                    </Badge>
                  </Td>
                  <Td>{e.debit ? formatAmount(e.debit, e.currency) : "—"}</Td>
                  <Td>{e.credit ? formatAmount(e.credit, e.currency) : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      ) : null}
      {tab === "customer" && customer ? (
        <Card className="mt-4 p-5">
          <Link
            to={`/customers/${customer.id}`}
            className="text-ink hover:text-accent"
          >
            {customer.firstName} {customer.lastName}
          </Link>
          <p className="text-sm text-ink-3">{customer.email}</p>
        </Card>
      ) : null}
      {tab === "security" ? (
        <Card className="mt-4 grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Tenant" value={tenantLabel(a.tenantId)} />
          <Field label="Authorization" value="account:read" mono />
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
