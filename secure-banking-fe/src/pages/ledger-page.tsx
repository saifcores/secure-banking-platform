import { listTransactions } from "@/api/services.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardHeader } from "@/components/ui/card.tsx";
import { EmptyState } from "@/components/ui/feedback.tsx";
import { PageHeader } from "@/components/ui/stat-card.tsx";
import { Pagination, TableWrap, Td, Th } from "@/components/ui/table.tsx";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import { formatAmount, formatWhen, maskAccount } from "@/lib/format.ts";
import { demoStore } from "@/mock/store.ts";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function LedgerPage() {
  const mode = useLiveMode();
  const [page, setPage] = useState(1);
  useQuery({
    queryKey: ["transactions", mode.tenantId],
    queryFn: () => listTransactions(mode),
  });
  const rows = useMemo(() => {
    const all = demoStore.ledger;
    if (mode.isPlatform) return all;
    const allowed = new Set(
      demoStore.transactions
        .filter((t) => t.tenantId === mode.tenantId)
        .map((t) => t.reference),
    );
    return all.filter((e) => allowed.has(e.transactionRef));
  }, [mode]);
  const debit = rows.reduce((s, e) => s + (e.debit ?? 0), 0);
  const credit = rows.reduce((s, e) => s + (e.credit ?? 0), 0);
  const balanced = Math.abs(debit - credit) < 0.01;
  const pages = Math.max(1, Math.ceil(rows.length / 12));
  const slice = rows.slice((page - 1) * 12, page * 12);

  return (
    <div>
      <PageHeader
        title="Ledger"
        description="Financial entries across the platform"
      />
      <Card className="mb-4 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3">
            Ledger Integrity
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
            {balanced ? (
              <>
                <Check className="size-4 text-success" /> Balanced
              </>
            ) : (
              "Unbalanced"
            )}
          </p>
          <p className="text-xs text-ink-3">All entries reconciled</p>
        </div>
        <div className="shrink-0 text-left text-sm text-ink-2 sm:text-right">
          <p>Debit {formatAmount(debit, "XOF")}</p>
          <p>Credit {formatAmount(credit, "XOF")}</p>
        </div>
      </Card>
      <Card>
        <CardHeader title="Entries" />
        {slice.length ? (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Entry ID</Th>
                  <Th>Transaction</Th>
                  <Th>Account</Th>
                  <Th>Type</Th>
                  <Th>Debit</Th>
                  <Th>Credit</Th>
                  <Th>Currency</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {slice.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02]">
                    <Td mono>{e.entryId}</Td>
                    <Td mono>
                      <Link to={`/transactions/${e.transactionId}`}>
                        {e.transactionRef}
                      </Link>
                    </Td>
                    <Td mono>{maskAccount(e.accountNumber)}</Td>
                    <Td>
                      <Badge
                        tone={e.entryType === "DEBIT" ? "warning" : "info"}
                      >
                        {e.entryType}
                      </Badge>
                    </Td>
                    <Td className="tabular">
                      {e.debit ? formatAmount(e.debit, e.currency) : "—"}
                    </Td>
                    <Td className="tabular">
                      {e.credit ? formatAmount(e.credit, e.currency) : "—"}
                    </Td>
                    <Td>{e.currency}</Td>
                    <Td>{formatWhen(e.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState
            title="No ledger entries"
            description="Entries appear after completed transfers."
          />
        )}
      </Card>
    </div>
  );
}
