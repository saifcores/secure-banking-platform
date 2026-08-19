import { listAudit } from "@/api/services.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Card } from "@/components/ui/card.tsx";
import {
  CodeBlock,
  EmptyState,
  ErrorState,
} from "@/components/ui/feedback.tsx";
import { Input, Select } from "@/components/ui/input.tsx";
import { Drawer } from "@/components/ui/overlay.tsx";
import { SkeletonTable } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/ui/stat-card.tsx";
import { Pagination, TableWrap, Td, Th } from "@/components/ui/table.tsx";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import { formatDateTime, tenantLabel } from "@/lib/format.ts";
import type { AuditEvent } from "@/types/domain.ts";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export function AuditPage() {
  const mode = useLiveMode();
  const [filters, setFilters] = useState({
    user: "",
    tenant: "",
    action: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const query = useQuery({
    queryKey: ["audit", mode.tenantId],
    queryFn: () => listAudit(mode),
  });
  const filtered = useMemo(() => {
    return (query.data ?? []).filter((e) => {
      if (
        filters.user &&
        !e.actorId.toLowerCase().includes(filters.user.toLowerCase())
      )
        return false;
      if (filters.tenant && e.tenantId !== filters.tenant) return false;
      if (filters.action && !e.action.includes(filters.action)) return false;
      if (filters.status && e.status !== filters.status) return false;
      return true;
    });
  }, [filters, query.data]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const rows = filtered.slice((page - 1) * 10, page * 10);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Immutable event trail consumed from Kafka"
        toolbar={
          <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Input
              placeholder="User"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            />
            <Select
              value={filters.tenant}
              onChange={(e) =>
                setFilters({ ...filters, tenant: e.target.value })
              }
            >
              <option value="">Tenant</option>
              <option value="BANK_DAKAR">BANK DAKAR</option>
              <option value="BANK_ABIDJAN">BANK ABIDJAN</option>
              <option value="BANK_BAMAKO">BANK BAMAKO</option>
            </Select>
            <Input
              placeholder="Action"
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
            />
            <Select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">Status</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED</option>
              <option value="FAILED">FAILED</option>
            </Select>
            <Input type="date" defaultValue="2026-08-19" />
          </div>
        }
      />
      <Card>
        {query.isLoading ? <SkeletonTable /> : null}
        {query.isError ? (
          <ErrorState
            title="Unable to load audit events"
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {!query.isLoading && !rows.length ? (
          <EmptyState
            title="No audit events"
            description="Events appear as the platform processes activity."
          />
        ) : null}
        {rows.length ? (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Timestamp</Th>
                  <Th>Actor</Th>
                  <Th>Action</Th>
                  <Th>Resource</Th>
                  <Th>Tenant</Th>
                  <Th>Result</Th>
                  <Th>Trace ID</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.id}
                    className="cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => setSelected(e)}
                  >
                    <Td className="tabular">
                      {formatDateTime(e.createdAt).split(",")[1] ??
                        formatDateTime(e.createdAt)}
                    </Td>
                    <Td>{e.actorId}</Td>
                    <Td mono>{e.action}</Td>
                    <Td mono>{e.aggregateId.slice(0, 12)}</Td>
                    <Td>{tenantLabel(e.tenantId)}</Td>
                    <Td>
                      <Badge status={e.status}>{e.status}</Badge>
                    </Td>
                    <Td mono>{e.traceId}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        ) : null}
      </Card>
      <Drawer
        open={Boolean(selected)}
        title="Audit event payload"
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <p className="mono text-xs text-ink-3">{selected.id}</p>
            <CodeBlock code={selected.payload} />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
