import { createAccount, listAccounts, listCustomers } from "@/api/services.ts";
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
import { formatAmount, formatWhen, tenantLabel } from "@/lib/format.ts";
import { hasPermission } from "@/lib/rbac.ts";
import { kpis } from "@/mock/seed.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  currency: z.enum(["XOF", "EUR", "USD"]),
  initialBalance: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
});

type FormValues = z.infer<typeof schema>;

export function AccountsPage() {
  const mode = useLiveMode();
  const { user } = useAuth();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const canCreate = hasPermission(user?.permissions ?? [], "account:create");
  const query = useQuery({
    queryKey: ["accounts", mode.tenantId],
    queryFn: () => listAccounts(mode),
  });
  const customers = useQuery({
    queryKey: ["customers", mode.tenantId],
    queryFn: () => listCustomers(mode),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: "", currency: "XOF", initialBalance: "0" },
  });
  const customerName = (id: string) => {
    const c = (customers.data ?? []).find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "—";
  };
  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return (query.data ?? []).filter((a) => {
      const matchesTerm =
        `${a.accountNumber} ${a.currency} ${customerName(a.customerId)}`
          .toLowerCase()
          .includes(term);
      const matchesStatus = status === "ALL" || a.status === status;
      return matchesTerm && matchesStatus;
    });
  }, [q, query.data, customers.data, status]);
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function onCreate(values: FormValues) {
    await createAccount(
      {
        customerId: values.customerId,
        currency: values.currency,
        initialBalance: Number(values.initialBalance),
      },
      mode,
      { userId: user?.id ?? "demo", email: user?.email ?? "demo@local" },
    );
    toast.success("Account created");
    setOpen(false);
    form.reset();
    await client.invalidateQueries({ queryKey: ["accounts"] });
  }

  function exportRows() {
    downloadCsv(
      "accounts.csv",
      filtered.map((a) => ({
        account: a.accountNumber,
        customer: customerName(a.customerId),
        balance: a.balance,
        currency: a.currency,
        status: a.status,
        tenant: a.tenantId,
      })),
    );
    toast.success("Export ready");
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description={`${kpis.activeAccounts.toLocaleString("en-US")} active accounts`}
        actions={
          canCreate ? (
            <Button
              icon={<Plus className="size-3.5" />}
              onClick={() => setOpen(true)}
            >
              New Account
            </Button>
          ) : null
        }
        toolbar={
          <>
            <div className="w-full sm:w-48">
              <Input
                placeholder="Search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                trailing={<Search className="size-3.5" />}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
                <option value="CLOSED">Closed</option>
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
            title="Unable to load accounts"
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {!query.isLoading && !rows.length ? (
          <EmptyState
            title="No accounts yet"
            description="Accounts will appear here once customers are onboarded."
          />
        ) : null}
        {rows.length ? (
          <>
            <div className="hidden md:block">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Account</Th>
                    <Th>Customer</Th>
                    <Th>Balance</Th>
                    <Th>Currency</Th>
                    <Th>Status</Th>
                    <Th>Tenant</Th>
                    <Th>Last Activity</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <Td mono>
                        <Link
                          to={`/accounts/${a.id}`}
                          className="text-ink hover:text-accent"
                        >
                          {a.accountNumber}
                        </Link>
                      </Td>
                      <Td>{customerName(a.customerId)}</Td>
                      <Td className="text-base font-semibold tabular text-ink">
                        {formatAmount(a.balance, a.currency)}
                      </Td>
                      <Td>{a.currency}</Td>
                      <Td>
                        <Badge status={a.status}>{a.status}</Badge>
                      </Td>
                      <Td>{tenantLabel(a.tenantId)}</Td>
                      <Td>{formatWhen(a.updatedAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
            <div className="space-y-2 p-3 md:hidden">
              {rows.map((a) => (
                <Link
                  key={a.id}
                  to={`/accounts/${a.id}`}
                  className="block rounded-md border border-white/8 p-3"
                >
                  <p className="mono text-sm text-ink">{a.accountNumber}</p>
                  <p className="text-lg font-semibold">
                    {formatAmount(a.balance, a.currency)}
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
        title="New account"
        description="Opens an account in the current tenant with an optional opening balance."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={form.formState.isSubmitting}
              onClick={form.handleSubmit(onCreate)}
            >
              Create
            </Button>
          </div>
        }
      >
        <form className="space-y-3" onSubmit={form.handleSubmit(onCreate)}>
          <Select
            label="Customer"
            {...form.register("customerId")}
            error={form.formState.errors.customerId?.message}
          >
            <option value="">Select customer</option>
            {(customers.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </Select>
          <Select label="Currency" {...form.register("currency")}>
            <option value="XOF">XOF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </Select>
          <Input
            label="Opening balance"
            {...form.register("initialBalance")}
            error={form.formState.errors.initialBalance?.message}
          />
        </form>
      </Modal>
    </div>
  );
}
