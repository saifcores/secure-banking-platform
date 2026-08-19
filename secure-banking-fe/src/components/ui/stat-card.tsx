import { cn } from "@/lib/cn.ts";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Sparkline({
  values,
  className,
  color = "#3B82F6",
}: {
  values: number[];
  className?: string;
  color?: string;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const d = values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 28 - ((value - min) / span) * 24;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 32"
      className={cn("h-8 w-24 overflow-visible", className)}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  spark,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  icon: LucideIcon;
  spark?: number[];
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/8 bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
            {label}
          </p>
          <p className="mt-2 truncate text-[22px] font-semibold leading-none tracking-[-0.04em] text-ink tabular md:text-[26px]">
            {value}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/8 bg-navy-2 text-ink-2">
          <Icon className="size-4" strokeWidth={1.6} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0 text-xs text-ink-3">
          {trend ? <span className="mr-2 text-teal">{trend}</span> : null}
          <span className="truncate">{hint}</span>
        </div>
        {spark ? <Sparkline values={spark} className="hidden shrink-0 sm:block" /> : null}
      </div>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  toolbar,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
}) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">
              {kicker}
            </p>
          ) : null}
          <h1 className="break-all text-2xl font-semibold tracking-[-0.04em] text-ink md:text-[28px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-ink-3">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      ) : null}
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-xs text-ink-3">
      {items.map((item, i) => (
        <span key={item.label} className="flex min-w-0 items-center gap-2">
          {i > 0 ? <span className="text-white/20">/</span> : null}
          {item.href ? (
            <Link to={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-ink-2">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
