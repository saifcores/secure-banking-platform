import { useAuth } from "@/auth/session.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardHeader } from "@/components/ui/card.tsx";
import { PageHeader, StatCard } from "@/components/ui/stat-card.tsx";
import { TableWrap, Td, Th } from "@/components/ui/table.tsx";
import {
  formatAmount,
  formatWhen,
  greetingFor,
  maskAccount,
  tenantLabel,
} from "@/lib/format.ts";
import { kpiSparks, kpis, volumeSeries } from "@/mock/seed.ts";
import { useLiveMode } from "@/hooks/use-live-mode.ts";
import { listTransactions } from "@/api/services.ts";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeftRight, CheckCircle2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Range = keyof typeof volumeSeries;

export function OverviewPage() {
  const { user } = useAuth();
  const mode = useLiveMode();
  const [range, setRange] = useState<Range>("7D");
  const txQuery = useQuery({
    queryKey: ["transactions", mode.tenantId],
    queryFn: () => listTransactions(mode),
  });
  const chart = volumeSeries[range];
  const recent = (txQuery.data ?? []).slice(0, 8);
  const donut = kpis.statusMix;
  const tenantName = tenantLabel(user?.tenantId ?? "BANK_DAKAR");

  const pieData = useMemo(
    () =>
      donut.map((item) => ({
        name: item.label,
        value: item.value,
        color: item.color,
      })),
    [donut],
  );

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`${greetingFor()}, ${user?.firstName}. Here's what's happening across ${tenantName}.`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Balance"
          value={`${(kpis.totalBalance / 1_000_000_000).toFixed(2)}B XOF`}
          hint="Across active ledgers"
          trend="+2.4%"
          icon={Wallet}
          spark={kpiSparks.balance}
        />
        <StatCard
          label="Active Accounts"
          value={kpis.activeAccounts.toLocaleString("en-US")}
          hint="Tenant-isolated"
          trend="+118"
          icon={Activity}
          spark={kpiSparks.accounts}
        />
        <StatCard
          label="Transactions Today"
          value={kpis.transactionsToday.toLocaleString("en-US")}
          hint="Idempotent transfers"
          trend="+6.1%"
          icon={ArrowLeftRight}
          spark={kpiSparks.volume}
        />
        <StatCard
          label="Transaction Success Rate"
          value={`${kpis.successRate.toFixed(2)}%`}
          hint="Completed / submitted"
          trend="+0.04%"
          icon={CheckCircle2}
          spark={kpiSparks.success}
        />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader
            title="Transaction Volume"
            action={
              <div className="flex flex-wrap rounded-md border border-white/8 p-0.5">
                {(["24H", "7D", "30D", "90D"] as Range[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setRange(item)}
                    className={`rounded px-2 py-1 text-[11px] font-medium ${
                      range === item
                        ? "bg-white/8 text-ink"
                        : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            }
          />
          <div className="h-[280px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "#151B2E",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="successful"
                  stroke="#14B8A6"
                  fill="none"
                  strokeWidth={1.4}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke="#EF4444"
                  fill="none"
                  strokeWidth={1.2}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#3B82F6"
                  fill="url(#vol)"
                  strokeWidth={1.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Transactions"
            description="Status mix · last 24h"
          />
          <div className="flex flex-col items-center gap-5 px-5 pb-5 sm:flex-row sm:items-center">
            <div className="h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
              {donut.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 text-ink-2">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    {item.label}
                  </span>
                  <span className="tabular text-ink">
                    {item.value.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Recent Transactions"
          action={
            <Link to="/transactions" className="text-xs text-accent">
              View all
            </Link>
          }
        />
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
            {recent.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/[0.02]">
                <Td mono>
                  <Link
                    to={`/transactions/${tx.id}`}
                    className="text-ink hover:text-accent"
                  >
                    {tx.reference}
                  </Link>
                </Td>
                <Td className="tabular font-medium text-ink">
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
      </Card>
    </div>
  );
}
