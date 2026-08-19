import { cancelTransaction, getTransaction } from "@/api/services.ts";
import { useAuth } from "@/auth/session.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardHeader } from "@/components/ui/card.tsx";
import { ErrorState } from "@/components/ui/feedback.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Breadcrumb, PageHeader } from "@/components/ui/stat-card.tsx";
import { Timeline } from "@/components/ui/timeline.tsx";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import {
  formatAmount,
  formatDateTime,
  maskAccount,
  tenantLabel,
} from "@/lib/format.ts";
import { hasPermission } from "@/lib/rbac.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export function TransactionDetailPage() {
  const { id = "" } = useParams();
  const mode = useLiveMode();
  const { user } = useAuth();
  const client = useQueryClient();
  const [reversing, setReversing] = useState(false);
  const query = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => getTransaction(id, mode),
  });
  const tx = query.data;
  const canCancel = hasPermission(
    user?.permissions ?? [],
    "transaction:cancel",
  );

  if (query.isLoading) return <Skeleton className="h-80" />;
  if (!tx) return <ErrorState title="Transaction not found" />;

  const steps = [
    { label: "Created", done: true, time: formatDateTime(tx.createdAt) },
    {
      label: "Processing",
      done: tx.status !== "CREATED" && tx.status !== "FAILED",
      current: tx.status === "PROCESSING",
    },
    {
      label: "Validated",
      done: tx.status === "COMPLETED" || tx.status === "REVERSED",
    },
    {
      label:
        tx.status === "FAILED"
          ? "Failed"
          : tx.status === "REVERSED"
            ? "Reversed"
            : "Completed",
      done:
        tx.status === "COMPLETED" ||
        tx.status === "REVERSED" ||
        tx.status === "FAILED",
      current: tx.status === "FAILED",
    },
  ];
  const balanced =
    (tx.ledgerEntries?.length ?? 0) >= 2 &&
    (tx.ledgerEntries ?? []).reduce(
      (sum, e) => sum + (e.entryType === "DEBIT" ? e.amount : -e.amount),
      0,
    ) === 0;

  async function onReverse() {
    setReversing(true);
    try {
      const result = await cancelTransaction(id);
      if (!result) {
        toast.error("Transaction failed");
        return;
      }
      toast.success("Transaction reversed");
      await client.invalidateQueries({ queryKey: ["transaction", id] });
      await client.invalidateQueries({ queryKey: ["transactions"] });
    } catch {
      toast.error("Transaction failed");
    } finally {
      setReversing(false);
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Transactions", href: "/transactions" },
          { label: tx.reference },
        ]}
      />
      <PageHeader
        kicker="Transaction"
        title={tx.reference}
        description={`${tenantLabel(tx.tenantId)} · ${formatAmount(tx.amount, tx.currency)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge status={tx.status}>{tx.status}</Badge>
            {canCancel && tx.status === "COMPLETED" ? (
              <Button
                variant="danger"
                size="sm"
                loading={reversing}
                onClick={() => void onReverse()}
              >
                Reverse
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Lifecycle</h3>
          <Timeline steps={steps} />
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Transaction information" />
            <dl className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Item label="Reference" value={tx.reference} mono />
              <Item
                label="Amount"
                value={formatAmount(tx.amount, tx.currency)}
              />
              <Item label="Currency" value={tx.currency} />
              <Item label="Tenant" value={tenantLabel(tx.tenantId)} />
              <Item
                label="Idempotency Key"
                value={tx.idempotencyKey || "—"}
                mono
              />
              <Item label="Created" value={formatDateTime(tx.createdAt)} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Security information" />
            <dl className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Item label="User ID" value={tx.actorId || "—"} mono />
              <Item label="Client" value="banking-frontend" mono />
              <Item label="Authentication" value="OAuth2 / OIDC" />
              <Item label="Authorization" value="transaction:create" mono />
            </dl>
          </Card>
          <Card>
            <CardHeader
              title="Ledger"
              action={
                balanced ? (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <Check className="size-3.5" /> Balanced
                  </span>
                ) : (
                  <span className="text-xs text-warning">Pending</span>
                )
              }
            />
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
              {(tx.ledgerEntries ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-white/8 p-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    {entry.entryType}
                  </p>
                  <p className="mono mt-1 text-sm text-ink-2">
                    Account {maskAccount(entry.accountNumber)}
                  </p>
                  <p
                    className={`mt-2 text-xl font-semibold tabular ${entry.entryType === "DEBIT" ? "text-ink" : "text-teal"}`}
                  >
                    {entry.entryType === "DEBIT" ? "−" : "+"}
                    {formatAmount(entry.amount, entry.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Item({
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
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mono mt-1 break-all text-sm text-ink"
            : "mt-1 break-words text-sm text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}
