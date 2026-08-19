import { cn } from "@/lib/cn.ts";
import type { ReactNode } from "react";

export function TableWrap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-white/8 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  mono,
}: {
  children: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        "border-b border-white/6 px-4 py-3 text-ink-2",
        mono && "mono text-[12px] text-ink",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-white/8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition-colors",
            value === tab.id
              ? "border-accent text-ink"
              : "border-transparent text-ink-3 hover:text-ink-2",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-ink-3">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded border border-white/10 px-2 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded border border-white/10 px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
