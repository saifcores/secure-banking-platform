import type {
  Account,
  AuditEvent,
  Customer,
  LedgerEntry,
  SecurityEvent,
  ServiceHealth,
  StreamEvent,
  TenantId,
  Transaction,
  VolumePoint,
} from "@/types/domain.ts";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function id(kind: string, n: number) {
  return `${kind.replaceAll("_", "0").padEnd(8, "0").slice(0, 8)}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

const rng = mulberry32(20260819);
const now = new Date("2026-08-19T13:42:18Z");

function ago(minutes: number) {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

const people: {
  first: string;
  last: string;
  tenant: TenantId;
  cityCode: string;
}[] = [
  { first: "Awa", last: "Diop", tenant: "BANK_DAKAR", cityCode: "77" },
  { first: "Mamadou", last: "Ndiaye", tenant: "BANK_DAKAR", cityCode: "77" },
  { first: "Fatou", last: "Sow", tenant: "BANK_DAKAR", cityCode: "78" },
  { first: "Cheikh", last: "Ba", tenant: "BANK_DAKAR", cityCode: "76" },
  { first: "Aminata", last: "Touré", tenant: "BANK_DAKAR", cityCode: "77" },
  { first: "Ibrahima", last: "Fall", tenant: "BANK_DAKAR", cityCode: "70" },
  { first: "Khady", last: "Sarr", tenant: "BANK_DAKAR", cityCode: "77" },
  { first: "Ousmane", last: "Diagne", tenant: "BANK_DAKAR", cityCode: "78" },
  { first: "Ndeye", last: "Gueye", tenant: "BANK_DAKAR", cityCode: "77" },
  { first: "Moussa", last: "Kane", tenant: "BANK_DAKAR", cityCode: "76" },
  { first: "Aissatou", last: "Cissé", tenant: "BANK_DAKAR", cityCode: "77" },
  { first: "Pape", last: "Sy", tenant: "BANK_DAKAR", cityCode: "70" },
  { first: "Koffi", last: "Yao", tenant: "BANK_ABIDJAN", cityCode: "07" },
  { first: "Aya", last: "Kouassi", tenant: "BANK_ABIDJAN", cityCode: "05" },
  { first: "Yao", last: "Koné", tenant: "BANK_ABIDJAN", cityCode: "01" },
  { first: "Adjoua", last: "Bamba", tenant: "BANK_ABIDJAN", cityCode: "07" },
  {
    first: "Kouadio",
    last: "N'Guessan",
    tenant: "BANK_ABIDJAN",
    cityCode: "05",
  },
  { first: "Akissi", last: "Traoré", tenant: "BANK_ABIDJAN", cityCode: "01" },
  { first: "Jean-Marc", last: "Aka", tenant: "BANK_ABIDJAN", cityCode: "07" },
  { first: "Ama", last: "Diallo", tenant: "BANK_ABIDJAN", cityCode: "05" },
  { first: "Ibrahim", last: "Traoré", tenant: "BANK_BAMAKO", cityCode: "76" },
  { first: "Mariam", last: "Coulibaly", tenant: "BANK_BAMAKO", cityCode: "65" },
  { first: "Amadou", last: "Keita", tenant: "BANK_BAMAKO", cityCode: "66" },
  { first: "Fatoumata", last: "Diallo", tenant: "BANK_BAMAKO", cityCode: "76" },
  { first: "Seydou", last: "Touré", tenant: "BANK_BAMAKO", cityCode: "65" },
  { first: "Aissata", last: "Sangaré", tenant: "BANK_BAMAKO", cityCode: "66" },
  { first: "Moussa", last: "Diarra", tenant: "BANK_BAMAKO", cityCode: "76" },
  { first: "Oumou", last: "Traoré", tenant: "BANK_BAMAKO", cityCode: "65" },
];

const prefixes: Record<Exclude<TenantId, "PLATFORM">, string> = {
  BANK_DAKAR: "DK",
  BANK_ABIDJAN: "AB",
  BANK_BAMAKO: "BM",
};

export const customers: Customer[] = people.map((p, i) => {
  const email = `${p.first.toLowerCase().replaceAll("-", ".")}.${p.last.toLowerCase().replaceAll("'", "")}@${p.tenant.toLowerCase().replaceAll("_", "-")}.local`;
  return {
    id: id("cust", i + 1),
    tenantId: p.tenant,
    keycloakUserId: id("kc", i + 1),
    firstName: p.first,
    lastName: p.last,
    email,
    phone: `+221 ${p.cityCode} ${String(100 + i).padStart(3, "0")} ${String(40 + i).padStart(2, "0")} ${String(10 + i).padStart(2, "0")}`,
    status: i % 17 === 0 ? "PENDING" : "ACTIVE",
    createdAt: ago(20_000 + i * 140),
    updatedAt: ago(120 + i * 3),
  };
});

export const accounts: Account[] = customers.flatMap((customer, i) => {
  const prefix = prefixes[customer.tenantId as Exclude<TenantId, "PLATFORM">];
  const n = 2 + (i % 2);
  return Array.from({ length: n }, (_, j) => {
    const num = `${prefix}${String(1000 + i * 17 + j * 3).padStart(6, "0")}`;
    const special =
      customer.firstName === "Awa" && j === 0
        ? "DK001234"
        : customer.firstName === "Awa" && j === 1
          ? "DK005678"
          : customer.firstName === "Koffi" && j === 0
            ? "AB001234"
            : num;
    return {
      id: id("acct", i * 4 + j + 1),
      accountNumber: special,
      customerId: customer.id,
      tenantId: customer.tenantId,
      currency: (j === 2 ? "EUR" : "XOF") as Account["currency"],
      balance: Math.round((rng() * 8_500_000 + 120_000) / 50) * 50,
      status: (i + j) % 23 === 0 ? "BLOCKED" : "ACTIVE",
      createdAt: customer.createdAt,
      updatedAt: ago(8 + i + j),
    } satisfies Account;
  });
});

const statuses: Transaction["status"][] = [
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "PROCESSING",
  "FAILED",
  "REVERSED",
];

function ledgerFor(
  tx: Omit<Transaction, "ledgerEntries">,
  seq: number,
): LedgerEntry[] {
  const debit: LedgerEntry = {
    id: id("led", seq),
    entryId: `LED-${String(900 + seq).padStart(6, "0")}`,
    transactionId: tx.id,
    transactionRef: tx.reference,
    accountNumber: tx.sourceAccount,
    entryType: "DEBIT",
    debit: tx.amount,
    credit: null,
    amount: tx.amount,
    currency: tx.currency,
    createdAt: tx.createdAt,
  };
  const credit: LedgerEntry = {
    id: id("led", seq + 1),
    entryId: `LED-${String(901 + seq).padStart(6, "0")}`,
    transactionId: tx.id,
    transactionRef: tx.reference,
    accountNumber: tx.destinationAccount,
    entryType: "CREDIT",
    debit: null,
    credit: tx.amount,
    amount: tx.amount,
    currency: tx.currency,
    createdAt: tx.createdAt,
  };
  return [debit, credit];
}

const amounts = [
  25000, 75000, 150000, 220000, 48000, 910000, 12500, 340000, 500000, 1_200_000,
];

export const transactions: Transaction[] = Array.from(
  { length: 42 },
  (_, i) => {
    const src = accounts[i % accounts.length];
    const dstPool = accounts.filter(
      (a) =>
        a.tenantId === src.tenantId && a.accountNumber !== src.accountNumber,
    );
    const dst =
      dstPool[i % dstPool.length] ?? accounts[(i + 1) % accounts.length];
    const status = i === 0 ? "COMPLETED" : statuses[i % statuses.length];
    const createdAt = ago(i === 0 ? 2 : 4 + i * 7);
    const reference = `TX-20260819-${String(142 - i).padStart(5, "0")}`;
    const base: Omit<Transaction, "ledgerEntries"> = {
      id: id("tx", i + 1),
      reference,
      tenantId: src.tenantId,
      sourceAccount: src.accountNumber,
      destinationAccount: dst.accountNumber,
      amount: amounts[i % amounts.length],
      currency: src.currency,
      status,
      failureReason: status === "FAILED" ? "INSUFFICIENT_FUNDS" : null,
      idempotencyKey: `idem_${(8578450 + i).toString(36)}`,
      createdAt,
      updatedAt: createdAt,
      actorId: customers[i % customers.length].email,
    };
    if (i === 0) {
      base.sourceAccount = "DK001234";
      base.destinationAccount = "DK005678";
      base.amount = 150000;
      base.tenantId = "BANK_DAKAR";
      base.idempotencyKey = "idem_82hd92a1";
      base.actorId = "awa.diop@bank-dakar.local";
    }
    return {
      ...base,
      ledgerEntries: status === "FAILED" ? [] : ledgerFor(base, i * 2 + 1),
    };
  },
);

export const ledgerEntries: LedgerEntry[] = transactions.flatMap(
  (tx) => tx.ledgerEntries,
);

export const kpis = {
  totalBalance: 1_840_000_000,
  activeAccounts: 24821,
  customers: 12482,
  transactionsToday: 12483,
  successRate: 99.82,
  statusMix: [
    { label: "Completed", value: 98.2, color: "#22C55E" },
    { label: "Processing", value: 0.9, color: "#3B82F6" },
    { label: "Failed", value: 0.6, color: "#EF4444" },
    { label: "Reversed", value: 0.3, color: "#F59E0B" },
  ],
};

export const volumeSeries: Record<"24H" | "7D" | "30D" | "90D", VolumePoint[]> =
  {
    "24H": Array.from({ length: 24 }, (_, i) => {
      const volume = 180 + Math.round(Math.sin(i / 3) * 90 + rng() * 40);
      const failed = Math.round(volume * 0.012);
      return {
        label: `${String(i).padStart(2, "0")}:00`,
        volume,
        successful: volume - failed,
        failed,
      };
    }),
    "7D": ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"].map((label, i) => {
      const volume = 8200 + Math.round(Math.sin(i) * 1400 + rng() * 400);
      const failed = Math.round(volume * 0.011);
      return { label, volume, successful: volume - failed, failed };
    }),
    "30D": Array.from({ length: 30 }, (_, i) => {
      const volume = 9000 + Math.round(Math.cos(i / 4) * 1800 + rng() * 500);
      const failed = Math.round(volume * 0.01);
      return { label: `${i + 1}`, volume, successful: volume - failed, failed };
    }),
    "90D": Array.from({ length: 12 }, (_, i) => {
      const volume = 28000 + Math.round(Math.sin(i / 2) * 6000 + rng() * 900);
      const failed = Math.round(volume * 0.009);
      return {
        label: `W${i + 1}`,
        volume,
        successful: volume - failed,
        failed,
      };
    }),
  };

export const kpiSparks = {
  balance: [42, 48, 46, 51, 55, 53, 61, 64, 62, 70, 74, 78],
  accounts: [20, 22, 21, 24, 26, 28, 27, 30, 33, 34, 36, 38],
  volume: [18, 22, 19, 28, 24, 32, 30, 36, 40, 38, 44, 47],
  success: [96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 100, 99],
};

const actions = [
  "CREATE_TRANSACTION",
  "READ_ACCOUNT",
  "LOGIN",
  "TOKEN_REFRESH",
  "ACCESS_DENIED",
  "LEDGER_POST",
  "UPDATE_CUSTOMER",
];

export const auditEvents: AuditEvent[] = Array.from({ length: 36 }, (_, i) => {
  const tx = transactions[i % transactions.length];
  const action = i === 4 ? "ACCESS_DENIED" : actions[i % actions.length];
  const status =
    action === "ACCESS_DENIED" ? "DENIED" : i % 19 === 0 ? "FAILED" : "SUCCESS";
  const payload = {
    action,
    resource: tx.reference,
    tenant: tx.tenantId,
    actor: tx.actorId,
    result: status,
    auth: "OAuth2 / OIDC",
    permission:
      action === "CREATE_TRANSACTION" ? "transaction:create" : "account:read",
  };
  return {
    id: id("aud", i + 1),
    tenantId: i === 4 ? "BANK_ABIDJAN" : tx.tenantId,
    eventType:
      action === "LOGIN"
        ? "AUTH"
        : action.startsWith("LEDGER")
          ? "LEDGER"
          : "TRANSACTION",
    aggregateType: "Transaction",
    aggregateId: tx.id,
    actorId: tx.actorId,
    action,
    status,
    payload: JSON.stringify(payload, null, 2),
    traceId: `trc_${(0x92ab00 + i).toString(16)}`,
    createdAt: ago(i === 0 ? 0 : 2 + i * 3),
  };
});

auditEvents[0] = {
  ...auditEvents[0],
  action: "CREATE_TRANSACTION",
  actorId: "user@bank.com",
  aggregateId: transactions[0].id,
  status: "SUCCESS",
  traceId: "trc_92ab11c4",
  createdAt: "2026-08-19T13:42:18Z",
};

export const streamEvents: StreamEvent[] = [
  {
    id: "se1",
    type: "TRANSACTION_CREATED",
    category: "Transactions",
    title: "TRANSACTION_CREATED",
    subtitle: transactions[0].reference,
    createdAt: ago(0),
  },
  {
    id: "se2",
    type: "LEDGER_ENTRY_CREATED",
    category: "Ledger",
    title: "LEDGER_ENTRY_CREATED",
    subtitle: ledgerEntries[0]?.entryId ?? "LED-000921",
    createdAt: ago(0.02),
  },
  {
    id: "se3",
    type: "AUDIT_EVENT_CREATED",
    category: "Audit",
    title: "AUDIT_EVENT_CREATED",
    subtitle: "AUD-01922",
    createdAt: ago(0.03),
  },
  ...transactions.slice(1, 18).map((tx, i) => ({
    id: `se${i + 4}`,
    type: "TRANSACTION_CREATED" as const,
    category: "Transactions" as const,
    title: "TRANSACTION_CREATED",
    subtitle: tx.reference,
    createdAt: tx.createdAt,
  })),
];

export const securityEvents: SecurityEvent[] = [
  {
    id: "s1",
    time: "13:42",
    title: "Successful login",
    detail: "user@example.com",
    tone: "success",
  },
  {
    id: "s2",
    time: "13:40",
    title: "Transaction authorized",
    detail: "transaction:create",
    tone: "success",
  },
  {
    id: "s3",
    time: "13:37",
    title: "Access denied",
    detail: "Cross-tenant resource",
    tone: "danger",
  },
  {
    id: "s4",
    time: "13:30",
    title: "Token refreshed",
    detail: "banking-frontend",
    tone: "neutral",
  },
  {
    id: "s5",
    time: "13:12",
    title: "JWT validated",
    detail: "iss=banking realm",
    tone: "success",
  },
  {
    id: "s6",
    time: "12:58",
    title: "Tenant bound",
    detail: "BANK_DAKAR",
    tone: "neutral",
  },
  {
    id: "s7",
    time: "12:41",
    title: "MFA challenge passed",
    detail: "totp",
    tone: "success",
  },
  {
    id: "s8",
    time: "12:18",
    title: "Rate limit remaining",
    detail: "27 / 30 rpm",
    tone: "warning",
  },
];

export const services: ServiceHealth[] = [
  "API Gateway",
  "Customer Service",
  "Account Service",
  "Transaction Service",
  "Audit Service",
  "Keycloak",
  "Kafka",
  "PostgreSQL",
].map((name, i) => ({
  id: name.toLowerCase().replaceAll(" ", "-"),
  name,
  status: i === 7 ? "Operational" : "Operational",
  latencyMs: [12, 18, 16, 22, 19, 28, 9, 7][i],
  requests: [12840, 4210, 9032, 12483, 11890, 640, 22100, 18400][i],
  errorRate: [0.02, 0.01, 0.03, 0.04, 0.01, 0, 0.01, 0][i],
  availability: [99.99, 99.98, 99.97, 99.96, 99.99, 100, 99.99, 100][i],
  spark: Array.from(
    { length: 16 },
    (_, j) => 8 + Math.round(Math.sin((i + j) / 2.4) * 6 + rng() * 4),
  ),
}));

export const DEMO_USER = {
  id: "user-admin-demo",
  username: "diallo",
  email: "saifoulaye.diallo@securebank.local",
  firstName: "Saïfoulaye",
  lastName: "Diallo",
  role: "ADMIN" as const,
  roles: ["ADMIN"] as const,
  tenantId: "BANK_DAKAR" as const,
};
