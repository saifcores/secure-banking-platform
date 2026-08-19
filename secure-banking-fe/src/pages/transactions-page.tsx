import { createTransaction, listTransactions } from "@/api/services.ts";
import { useAuth } from "@/auth/session.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { EmptyState, ErrorState } from "@/components/ui/feedback.tsx";
import { Input, Select } from "@/components/ui/input.tsx";
import { Modal } from "@/components/ui/overlay.tsx";
import { SkeletonTable } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/ui/stat-card.tsx";
import { Pagination, TableWrap, Td, Th } from "@/components/ui/table.tsx";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import { downloadCsv } from "@/lib/export.ts";
import {
  formatAmount,
  formatWhen,
  maskAccount,
  tenantLabel,
} from "@/lib/format.ts";
import { hasPermission } from "@/lib/rbac.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  sourceAccount: z.string().min(4),
  destinationAccount: z.string().min(4),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.enum(["XOF", "EUR", "USD"]),
});

type FormValues = z.infer<typeof schema>;

export function TransactionsPage() {
  const mode = useLiveMode();
  const { user } = useAuth();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const canCreate = hasPermission(
    user?.permissions ?? [],
    "transaction:create",
  );
  const query = useQuery({
    queryKey: ["transactions", mode.tenantId],
    queryFn: () => listTransactions(mode),
  });
  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return (query.data ?? []).filter((t) => {
      const matchesTerm =
        `${t.reference} ${t.sourceAccount} ${t.destinationAccount} ${t.status}`
          .toLowerCase()
          .includes(term);
      const matchesStatus = status === "ALL" || t.status === status;
      return matchesTerm && matchesStatus;
    });
  }, [q, query.data, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const rows = filtered.slice((page - 1) * 10, page * 10);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceAccount: "DK001234",
      destinationAccount: "DK005678",
      amount: "150000",
      currency: "XOF",
    },
  });

  async function onSubmit(values: FormValues) {
    await createTransaction(
      {
        sourceAccount: values.sourceAccount,
        destinationAccount: values.destinationAccount,
        amount: Number(values.amount),
        currency: values.currency,
      },
      mode,
    );
    toast.success("Transaction created");
    setOpen(false);
    await client.invalidateQueries({ queryKey: ["transactions"] });
  }

  function exportRows() {
    downloadCsv(
      "transactions.csv",
      filtered.map((t) => ({
        reference: t.reference,
        amount: t.amount,
        currency: t.currency,
        from: t.sourceAccount,
        to: t.destinationAccount,
        status: t.status,
        tenant: t.tenantId,
      })),
    );
    toast.success("Export ready");
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Idempotent transfers with double-entry posting"
        actions={
          canCreate ? (
            <Button
              icon={<Plus className="size-3.5" />}
              onClick={() => setOpen(true)}
            >
              New transfer
            </Button>
          ) : null
        }
        toolbar={
          <>
            <div className="w-full sm:w-48">
              <Input
                placeholder="Search reference"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
                <option value="REVERSED">Reversed</option>
              </Select>
            </div>
            <Button
              variant="secondary"
              icon={<Download className="size-3.5" />}
              onClick={exportRows}
            >
              Export
            </Button>
          </>
        }
      />
      <Card>
        {query.isLoading ? <SkeletonTable /> : null}
        {query.isError ? (
          <ErrorState
            title="Unable to load transactions"
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {!query.isLoading && !rows.length ? (
          <EmptyState
            title="No transactions yet"
            description="Transactions will appear here once activity begins."
          />
        ) : null}
        {rows.length ? (
          <>
            <div className="hidden md:block">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Amount</Th>
                    <Th>From</Th>
                    <Th>To</Th>
                    <Th>Status</Th>
                    <Th>Tenant</Th>
                    <Th>Created</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <Td mono>
                        <Link
                          to={`/transactions/${tx.id}`}
                          className="text-ink hover:text-accent"
                        >
                          {tx.reference}
                        </Link>
                      </Td>
                      <Td className="font-semibold tabular text-ink">
                        {formatAmount(tx.amount, tx.currency)}
                      </Td>
                      <Td mono>{maskAccount(tx.sourceAccount)}</Td>
                      <Td mono>{maskAccount(tx.destinationAccount)}</Td>
                      <Td>
                        <Badge status={tx.status}>{tx.status}</Badge>
                      </Td>
                      <Td>{tenantLabel(tx.tenantId)}</Td>
                      <Td>{formatWhen(tx.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
            <div className="space-y-2 p-3 md:hidden">
              {rows.map((tx) => (
                <Link
                  key={tx.id}
                  to={`/transactions/${tx.id}`}
                  className="block rounded-md border border-white/8 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-xs">{tx.reference}</span>
                    <Badge status={tx.status}>{tx.status}</Badge>
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    {formatAmount(tx.amount, tx.currency)}
                  </p>
                </Link>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        ) : null}
      </Card>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create transfer"
        description="Idempotency-Key is generated automatically."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={form.formState.isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
            >
              Submit
            </Button>
          </div>
        }
      >
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Input
            label="From"
            mono
            {...form.register("sourceAccount")}
            error={form.formState.errors.sourceAccount?.message}
          />
          <Input
            label="To"
            mono
            {...form.register("destinationAccount")}
            error={form.formState.errors.destinationAccount?.message}
          />
          <Input
            label="Amount"
            {...form.register("amount")}
            error={form.formState.errors.amount?.message}
          />
          <Select label="Currency" {...form.register("currency")}>
            <option value="XOF">XOF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
