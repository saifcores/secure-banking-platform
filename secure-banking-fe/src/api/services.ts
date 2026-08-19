import { api } from "@/api/client.ts";
import { demoStore, nextReference } from "@/mock/store.ts";
import { tenantPrefix } from "@/lib/format.ts";
import type {
  Account,
  AuditEvent,
  Currency,
  Customer,
  LedgerEntry,
  LedgerType,
  TenantId,
  Transaction,
  TxStatus,
} from "@/types/domain.ts";

export type LiveMode = { live: boolean; tenantId: TenantId; isPlatform: boolean };

function scoped<T extends { tenantId: TenantId }>(rows: T[], mode: LiveMode) {
  return demoStore.filterByTenant(rows, mode.tenantId, mode.isPlatform);
}

async function tryLive<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapAccount(raw: Account): Account {
  return { ...raw, balance: num(raw.balance) };
}

function mapLedger(
  entry: Partial<LedgerEntry> & {
    entryType: LedgerType;
    amount: unknown;
    accountNumber: string;
  },
  tx: Pick<Transaction, "id" | "reference" | "createdAt" | "currency">,
  index: number,
): LedgerEntry {
  const amount = num(entry.amount);
  const type = entry.entryType;
  return {
    id: entry.id ?? crypto.randomUUID(),
    entryId: entry.entryId ?? `LED-${String(index + 1).padStart(6, "0")}`,
    transactionId: tx.id,
    transactionRef: tx.reference,
    accountNumber: entry.accountNumber,
    entryType: type,
    debit: type === "DEBIT" ? amount : null,
    credit: type === "CREDIT" ? amount : null,
    amount,
    currency: (entry.currency ?? tx.currency) as Currency,
    createdAt: entry.createdAt ?? tx.createdAt,
  };
}

function mapTransaction(raw: Transaction): Transaction {
  const base: Transaction = {
    ...raw,
    amount: num(raw.amount),
    idempotencyKey: raw.idempotencyKey ?? "—",
    actorId: raw.actorId ?? "unknown",
    ledgerEntries: [],
    status: raw.status as TxStatus,
  };
  base.ledgerEntries = (raw.ledgerEntries ?? []).map((entry, i) =>
    mapLedger(entry, base, i),
  );
  return base;
}

export function listCustomers(mode: LiveMode) {
  return tryLive(
    async () => {
      const { data } = await api.get<Customer[]>("/api/v1/customers");
      return data.length ? data : scoped(demoStore.customers, mode);
    },
    scoped(demoStore.customers, mode),
  );
}

export function getCustomer(id: string, mode: LiveMode) {
  return tryLive(
    async () => {
      const { data } = await api.get<Customer>(`/api/v1/customers/${id}`);
      return data;
    },
    scoped(demoStore.customers, mode).find((c) => c.id === id) ?? null,
  );
}

export function listAccounts(mode: LiveMode) {
  return tryLive(
    async () => {
      const { data } = await api.get<Account[]>("/api/v1/accounts");
      return data.length ? data.map(mapAccount) : scoped(demoStore.accounts, mode);
    },
    scoped(demoStore.accounts, mode),
  );
}

export function getAccount(id: string, mode: LiveMode) {
  return tryLive(
    async () => {
      const { data } = await api.get<Account>(`/api/v1/accounts/${id}`);
      return mapAccount(data);
    },
    scoped(demoStore.accounts, mode).find((a) => a.id === id) ??
      demoStore.accounts.find((a) => a.id === id) ??
      null,
  );
}

export async function createAccount(
  input: {
    customerId: string;
    currency: Currency;
    initialBalance: number;
  },
  mode: LiveMode,
  owner: { userId: string; email: string },
) {
  try {
    const { data } = await api.post<Account>("/api/v1/accounts", {
      customerId: input.customerId,
      ownerUserId: owner.userId,
      ownerEmail: owner.email,
      currency: input.currency,
      initialBalance: input.initialBalance,
    });
    return mapAccount(data);
  } catch {
    const tenantId = mode.tenantId === "PLATFORM" ? "BANK_DAKAR" : mode.tenantId;
    const createdAt = new Date().toISOString();
    const account: Account = {
      id: crypto.randomUUID(),
      accountNumber: `${tenantPrefix(tenantId)}${String(Math.floor(100000 + Math.random() * 900000))}`,
      customerId: input.customerId,
      tenantId,
      currency: input.currency,
      balance: input.initialBalance,
      status: "ACTIVE",
      createdAt,
      updatedAt: createdAt,
    };
    demoStore.addAccount(account);
    return account;
  }
}

export function listTransactions(mode: LiveMode) {
  return tryLive(
    async () => {
      const { data } = await api.get<Transaction[]>("/api/v1/transactions");
      return data.length
        ? data.map(mapTransaction)
        : scoped(demoStore.transactions, mode);
    },
    scoped(demoStore.transactions, mode),
  );
}

export function getTransaction(id: string, mode: LiveMode) {
  return tryLive(
    async () => {
      const { data } = await api.get<Transaction>(`/api/v1/transactions/${id}`);
      return mapTransaction(data);
    },
    scoped(demoStore.transactions, mode).find((t) => t.id === id) ??
      demoStore.transactions.find((t) => t.id === id) ??
      null,
  );
}

export async function createTransaction(
  input: {
    sourceAccount: string;
    destinationAccount: string;
    amount: number;
    currency: Transaction["currency"];
  },
  mode: LiveMode,
) {
  const idempotencyKey = `idem_${crypto.randomUUID().slice(0, 10)}`;
  try {
    const { data } = await api.post<Transaction>(
      "/api/v1/transactions",
      input,
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    return mapTransaction({ ...data, idempotencyKey, actorId: data.actorId });
  } catch {
    const createdAt = new Date().toISOString();
    const reference = nextReference();
    const tx: Transaction = {
      id: crypto.randomUUID(),
      reference,
      tenantId: mode.tenantId === "PLATFORM" ? "BANK_DAKAR" : mode.tenantId,
      sourceAccount: input.sourceAccount,
      destinationAccount: input.destinationAccount,
      amount: input.amount,
      currency: input.currency,
      status: "COMPLETED",
      failureReason: null,
      idempotencyKey,
      createdAt,
      updatedAt: createdAt,
      actorId: "demo",
      ledgerEntries: [],
    };
    tx.ledgerEntries = [
      mapLedger(
        {
          entryType: "DEBIT",
          amount: input.amount,
          accountNumber: input.sourceAccount,
          currency: input.currency,
        },
        tx,
        demoStore.ledger.length + 1,
      ),
      mapLedger(
        {
          entryType: "CREDIT",
          amount: input.amount,
          accountNumber: input.destinationAccount,
          currency: input.currency,
        },
        tx,
        demoStore.ledger.length + 2,
      ),
    ];
    demoStore.addTransaction(tx);
    return tx;
  }
}

export async function cancelTransaction(id: string) {
  try {
    const { data } = await api.post<Transaction>(
      `/api/v1/transactions/${id}/cancel`,
    );
    return mapTransaction(data);
  } catch {
    return demoStore.cancelTransaction(id);
  }
}

export function listAudit(mode: LiveMode) {
  return tryLive(
    async () => {
      const { data } = await api.get<{ content: AuditEvent[] }>(
        "/api/v1/audit",
        { params: { size: 50 } },
      );
      const rows = data.content ?? [];
      return rows.length ? rows : scoped(demoStore.audit, mode);
    },
    scoped(demoStore.audit, mode),
  );
}

export async function pingHealth() {
  try {
    const { data } = await api.get("/actuator/health");
    return data;
  } catch {
    return { status: "UNKNOWN" };
  }
}

export async function exploreApi(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
) {
  const { data, status, headers } = await api.request({
    method,
    url: path,
    data: body,
    validateStatus: () => true,
  });
  return { data, status, headers };
}
