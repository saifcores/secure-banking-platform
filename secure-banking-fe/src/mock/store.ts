import { permissionsFor } from "@/lib/rbac.ts";
import {
  accounts,
  auditEvents,
  customers,
  ledgerEntries,
  streamEvents,
  transactions,
} from "@/mock/seed.ts";
import type {
  Account,
  AuditEvent,
  Customer,
  LedgerEntry,
  Role,
  StreamEvent,
  TenantId,
  Transaction,
} from "@/types/domain.ts";

function clone<T>(value: T): T {
  return structuredClone(value);
}

class DemoStore {
  customers = clone(customers);
  accounts = clone(accounts);
  transactions = clone(transactions);
  ledger = clone(ledgerEntries);
  audit = clone(auditEvents);
  events = clone(streamEvents);

  filterByTenant<T extends { tenantId: TenantId }>(
    rows: T[],
    tenantId: TenantId,
    isPlatform: boolean,
  ) {
    if (isPlatform) return rows;
    return rows.filter((row) => row.tenantId === tenantId);
  }

  addTransaction(tx: Transaction) {
    this.transactions = [tx, ...this.transactions];
    this.ledger = [...tx.ledgerEntries, ...this.ledger];
    this.events = [
      {
        id: `live-${tx.id}`,
        type: "TRANSACTION_CREATED",
        category: "Transactions",
        title: "TRANSACTION_CREATED",
        subtitle: tx.reference,
        createdAt: tx.createdAt,
      },
      ...this.events,
    ];
  }

  addAccount(account: Account) {
    this.accounts = [account, ...this.accounts];
  }

  cancelTransaction(id: string) {
    const updatedAt = new Date().toISOString();
    this.transactions = this.transactions.map((tx) =>
      tx.id === id && tx.status === "COMPLETED"
        ? { ...tx, status: "REVERSED", updatedAt }
        : tx,
    );
    return this.transactions.find((tx) => tx.id === id) ?? null;
  }
}

export const demoStore = new DemoStore();

export const DEMO_ROLES: { role: Role; label: string; tenantId: TenantId }[] = [
  { role: "ADMIN", label: "Platform Admin", tenantId: "BANK_DAKAR" },
  { role: "OPERATOR", label: "Operator · Dakar", tenantId: "BANK_DAKAR" },
  { role: "AUDITOR", label: "Auditor", tenantId: "PLATFORM" },
  { role: "CUSTOMER", label: "Customer · Awa Diop", tenantId: "BANK_DAKAR" },
  { role: "SUPPORT", label: "Support · Dakar", tenantId: "BANK_DAKAR" },
];

export function demoPermissions(role: Role) {
  return permissionsFor([role]);
}

export function nextReference() {
  const n = demoStore.transactions.length + 143;
  return `TX-20260819-${String(n).padStart(5, "0")}`;
}

export type { AuditEvent, Customer, LedgerEntry, StreamEvent };
