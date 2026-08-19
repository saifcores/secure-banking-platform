import { listAccounts, listCustomers } from "@/api/services.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { EmptyState, ErrorState } from "@/components/ui/feedback.tsx";
import { Input, Select } from "@/components/ui/input.tsx";
import { SkeletonTable } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/ui/stat-card.tsx";
import { Pagination, TableWrap, Td, Th } from "@/components/ui/table.tsx";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import { downloadCsv } from "@/lib/export.ts";
import { formatWhen, initials, tenantLabel } from "@/lib/format.ts";
import { kpis } from "@/mock/seed.ts";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function CustomersPage() {
  const mode = useLiveMode();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["customers", mode.tenantId],
    queryFn: () => listCustomers(mode),
  });
  const accounts = useQuery({
    queryKey: ["accounts", mode.tenantId],
    queryFn: () => listAccounts(mode),
  });
  const accountCount = (customerId: string) =>
    (accounts.data ?? []).filter((a) => a.customerId === customerId).length;
  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return (query.data ?? []).filter((c) => {
      const matchesTerm = `${c.firstName} ${c.lastName} ${c.email} ${c.id}`
        .toLowerCase()
        .includes(term);
      const matchesStatus = status === "ALL" || c.status === status;
      return matchesTerm && matchesStatus;
    });
  }, [q, query.data, status]);
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function exportRows() {
    downloadCsv(
      "customers.csv",
      filtered.map((c) => ({
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        status: c.status,
        tenant: c.tenantId,
        accounts: accountCount(c.id),
      })),
    );
    toast.success("Export ready");
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${kpis.customers.toLocaleString("en-US")} customers`}
        toolbar={
          <>
            <div className="w-full sm:w-56">
              <Input
                placeholder="Search customers"
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
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
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
            title="Unable to load customers"
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {!query.isLoading && !filtered.length ? (
          <EmptyState
            title="No customers yet"
            description="Customers will appear here once onboarding begins."
          />
        ) : null}
        {rows.length ? (
          <>
            <div className="hidden md:block">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Customer</Th>
                    <Th>Customer ID</Th>
                    <Th>Accounts</Th>
                    <Th>Status</Th>
                    <Th>Tenant</Th>
                    <Th>Created</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <Td>
                        <Link
                          to={`/customers/${c.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex size-8 items-center justify-center rounded-md bg-white/5 text-[11px] font-semibold">
                            {initials(c.firstName, c.lastName)}
                          </span>
                          <span>
                            <span className="block font-medium text-ink">
                              {c.firstName} {c.lastName}
                            </span>
                            <span className="block text-xs text-ink-3">
                              {c.email}
                            </span>
                          </span>
                        </Link>
                      </Td>
                      <Td mono>{c.id.slice(0, 13)}…</Td>
                      <Td className="tabular">{accountCount(c.id)}</Td>
                      <Td>
                        <Badge status={c.status}>{c.status}</Badge>
                      </Td>
                      <Td>{tenantLabel(c.tenantId)}</Td>
                      <Td>{formatWhen(c.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
            <div className="space-y-2 p-3 md:hidden">
              {rows.map((c) => (
                <Link
                  key={c.id}
                  to={`/customers/${c.id}`}
                  className="block rounded-md border border-white/8 p-3"
                >
                  <p className="font-medium text-ink">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-ink-3">
                    {c.email} · {accountCount(c.id)} accounts
                  </p>
                </Link>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        ) : null}
      </Card>
    </div>
  );
}
