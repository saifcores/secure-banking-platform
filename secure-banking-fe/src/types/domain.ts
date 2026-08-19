export const Role = {
  CUSTOMER: "CUSTOMER",
  OPERATOR: "OPERATOR",
  SUPPORT: "SUPPORT",
  AUDITOR: "AUDITOR",
  ADMIN: "ADMIN",
  SERVICE: "SERVICE",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Permission = {
  ACCOUNT_READ: "account:read",
  ACCOUNT_CREATE: "account:create",
  ACCOUNT_UPDATE: "account:update",
  TRANSACTION_READ: "transaction:read",
  TRANSACTION_CREATE: "transaction:create",
  TRANSACTION_CANCEL: "transaction:cancel",
  CUSTOMER_READ: "customer:read",
  CUSTOMER_UPDATE: "customer:update",
  AUDIT_READ: "audit:read",
  ADMIN: "admin",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CUSTOMER: [
    Permission.ACCOUNT_READ,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_CREATE,
    Permission.CUSTOMER_READ,
  ],
  OPERATOR: [
    Permission.ACCOUNT_READ,
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_UPDATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_CANCEL,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
  ],
  SUPPORT: [
    Permission.ACCOUNT_READ,
    Permission.TRANSACTION_READ,
    Permission.CUSTOMER_READ,
  ],
  AUDITOR: [Permission.AUDIT_READ],
  ADMIN: Object.values(Permission),
  SERVICE: [
    Permission.ACCOUNT_READ,
    Permission.ACCOUNT_UPDATE,
    Permission.TRANSACTION_READ,
    Permission.CUSTOMER_READ,
  ],
};

export const TenantId = {
  BANK_DAKAR: "BANK_DAKAR",
  BANK_ABIDJAN: "BANK_ABIDJAN",
  BANK_BAMAKO: "BANK_BAMAKO",
  PLATFORM: "PLATFORM",
} as const;

export type TenantId = (typeof TenantId)[keyof typeof TenantId];

export const TENANTS: {
  id: TenantId;
  name: string;
  city: string;
  prefix: string;
  currency: string;
  color: string;
}[] = [
  {
    id: "BANK_DAKAR",
    name: "BANK DAKAR",
    city: "Dakar",
    prefix: "DK",
    currency: "XOF",
    color: "#14B8A6",
  },
  {
    id: "BANK_ABIDJAN",
    name: "BANK ABIDJAN",
    city: "Abidjan",
    prefix: "AB",
    currency: "XOF",
    color: "#3B82F6",
  },
  {
    id: "BANK_BAMAKO",
    name: "BANK BAMAKO",
    city: "Bamako",
    prefix: "BM",
    currency: "XOF",
    color: "#F59E0B",
  },
  {
    id: "PLATFORM",
    name: "PLATFORM",
    city: "Control plane",
    prefix: "PL",
    currency: "XOF",
    color: "#64748B",
  },
];

export type AccountStatus = "ACTIVE" | "BLOCKED" | "CLOSED";
export type CustomerStatus = "ACTIVE" | "PENDING" | "SUSPENDED";
export type TxStatus =
  | "CREATED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";
export type LedgerType = "DEBIT" | "CREDIT";
export type Currency = "XOF" | "EUR" | "USD";
export type Environment = "DEMO" | "STAGING" | "PRODUCTION";

export type Customer = {
  id: string;
  tenantId: TenantId;
  keycloakUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
};

export type Account = {
  id: string;
  accountNumber: string;
  customerId: string;
  tenantId: TenantId;
  currency: Currency;
  balance: number;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type LedgerEntry = {
  id: string;
  entryId: string;
  transactionId: string;
  transactionRef: string;
  accountNumber: string;
  entryType: LedgerType;
  debit: number | null;
  credit: number | null;
  amount: number;
  currency: Currency;
  createdAt: string;
};

export type Transaction = {
  id: string;
  reference: string;
  tenantId: TenantId;
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  currency: Currency;
  status: TxStatus;
  failureReason: string | null;
  idempotencyKey: string;
  ledgerEntries: LedgerEntry[];
  createdAt: string;
  updatedAt: string;
  actorId: string;
};

export type AuditEvent = {
  id: string;
  tenantId: TenantId;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actorId: string;
  action: string;
  status: "SUCCESS" | "DENIED" | "FAILED";
  payload: string;
  traceId: string;
  createdAt: string;
};

export type StreamEvent = {
  id: string;
  type:
    | "TRANSACTION_CREATED"
    | "LEDGER_ENTRY_CREATED"
    | "AUDIT_EVENT_CREATED"
    | "AUTH_EVENT";
  category: "Transactions" | "Ledger" | "Audit" | "Security";
  title: string;
  subtitle: string;
  createdAt: string;
};

export type SecurityEvent = {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "neutral";
};

export type ServiceHealth = {
  id: string;
  name: string;
  status: "Operational" | "Degraded" | "Down";
  latencyMs: number;
  requests: number;
  errorRate: number;
  availability: number;
  spark: number[];
};

export type VolumePoint = {
  label: string;
  volume: number;
  successful: number;
  failed: number;
};

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  roles: Role[];
  tenantId: TenantId;
  permissions: Permission[];
  token?: string;
  tokenParsed?: Record<string, unknown>;
};
