import { useAuth } from "@/auth/session.tsx";
import { tenantLabel } from "@/lib/format.ts";
import { demoStore } from "@/mock/store.ts";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SearchCommand({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isPlatform = user?.role === "ADMIN" || user?.tenantId === "PLATFORM";
  const tenantId = user?.tenantId ?? "BANK_DAKAR";

  useEffect(() => {
    if (open) {
      setQ("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 1) return [];
    const customers = demoStore
      .filterByTenant(demoStore.customers, tenantId, Boolean(isPlatform))
      .filter((c) =>
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(term),
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        href: `/customers/${c.id}`,
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.email,
        kind: "Customer",
      }));
    const accounts = demoStore
      .filterByTenant(demoStore.accounts, tenantId, Boolean(isPlatform))
      .filter((a) => a.accountNumber.toLowerCase().includes(term))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        href: `/accounts/${a.id}`,
        title: a.accountNumber,
        subtitle: tenantLabel(a.tenantId),
        kind: "Account",
      }));
    const txs = demoStore
      .filterByTenant(demoStore.transactions, tenantId, Boolean(isPlatform))
      .filter((t) =>
        `${t.reference} ${t.sourceAccount} ${t.destinationAccount}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        href: `/transactions/${t.id}`,
        title: t.reference,
        subtitle: t.status,
        kind: "Transaction",
      }));
    return [...customers, ...accounts, ...txs];
  }, [isPlatform, q, tenantId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[14vh]">
      <button
        className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close search"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-white/10 bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/8 px-3">
          <Search className="size-4 text-ink-3" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customers, accounts, transactions"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-ink-3 sm:inline">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {q && !results.length ? (
            <p className="px-3 py-6 text-center text-sm text-ink-3">
              No matches in {tenantLabel(tenantId)}.
            </p>
          ) : null}
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.href);
                onClose();
              }}
              className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left hover:bg-white/5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">
                  {item.title}
                </span>
                <span className="mono block truncate text-[11px] text-ink-3">
                  {item.subtitle}
                </span>
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-ink-3">
                {item.kind}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
