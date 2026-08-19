import { AuthProvider, useAuth } from "@/auth/session.tsx";
import { AppShell, ProtectedRoute } from "@/components/layout/app-shell.tsx";
import { canSeeNav } from "@/lib/rbac.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

const LoginPage = lazy(() =>
  import("@/pages/login-page.tsx").then((m) => ({ default: m.LoginPage })),
);
const OverviewPage = lazy(() =>
  import("@/pages/overview-page.tsx").then((m) => ({
    default: m.OverviewPage,
  })),
);
const CustomersPage = lazy(() =>
  import("@/pages/customers-page.tsx").then((m) => ({
    default: m.CustomersPage,
  })),
);
const CustomerDetailPage = lazy(() =>
  import("@/pages/customer-detail-page.tsx").then((m) => ({
    default: m.CustomerDetailPage,
  })),
);
const AccountsPage = lazy(() =>
  import("@/pages/accounts-page.tsx").then((m) => ({
    default: m.AccountsPage,
  })),
);
const AccountDetailPage = lazy(() =>
  import("@/pages/account-detail-page.tsx").then((m) => ({
    default: m.AccountDetailPage,
  })),
);
const TransactionsPage = lazy(() =>
  import("@/pages/transactions-page.tsx").then((m) => ({
    default: m.TransactionsPage,
  })),
);
const TransactionDetailPage = lazy(() =>
  import("@/pages/transaction-detail-page.tsx").then((m) => ({
    default: m.TransactionDetailPage,
  })),
);
const LedgerPage = lazy(() =>
  import("@/pages/ledger-page.tsx").then((m) => ({ default: m.LedgerPage })),
);
const SecurityPage = lazy(() =>
  import("@/pages/security-page.tsx").then((m) => ({
    default: m.SecurityPage,
  })),
);
const AuditPage = lazy(() =>
  import("@/pages/audit-page.tsx").then((m) => ({ default: m.AuditPage })),
);
const HealthPage = lazy(() =>
  import("@/pages/health-page.tsx").then((m) => ({ default: m.HealthPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/settings-page.tsx").then((m) => ({
    default: m.SettingsPage,
  })),
);
const developers = () => import("@/pages/developers-page.tsx");
const ApiExplorerPage = lazy(() =>
  developers().then((m) => ({ default: m.ApiExplorerPage })),
);
const OauthPage = lazy(() =>
  developers().then((m) => ({ default: m.OauthPage })),
);
const JwtInspectorPage = lazy(() =>
  developers().then((m) => ({ default: m.JwtInspectorPage })),
);
const EventsPage = lazy(() =>
  developers().then((m) => ({ default: m.EventsPage })),
);
const WebhooksPage = lazy(() =>
  developers().then((m) => ({ default: m.WebhooksPage })),
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Gate({
  nav,
  children,
}: {
  nav: Parameters<typeof canSeeNav>[1];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!canSeeNav(user?.roles ?? [], nav))
    return <Navigate to="/overview" replace />;
  return children;
}

function PageFallback() {
  return (
    <div className="animate-pulse text-sm text-ink-3">Loading workspace…</div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#151B2E",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F8FAFC",
              },
            }}
          />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/overview" replace />} />
                <Route path="/overview" element={<OverviewPage />} />
                <Route
                  path="/customers"
                  element={
                    <Gate nav="customers">
                      <CustomersPage />
                    </Gate>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <Gate nav="customers">
                      <CustomerDetailPage />
                    </Gate>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <Gate nav="accounts">
                      <AccountsPage />
                    </Gate>
                  }
                />
                <Route
                  path="/accounts/:id"
                  element={
                    <Gate nav="accounts">
                      <AccountDetailPage />
                    </Gate>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <Gate nav="transactions">
                      <TransactionsPage />
                    </Gate>
                  }
                />
                <Route
                  path="/transactions/:id"
                  element={
                    <Gate nav="transactions">
                      <TransactionDetailPage />
                    </Gate>
                  }
                />
                <Route
                  path="/ledger"
                  element={
                    <Gate nav="ledger">
                      <LedgerPage />
                    </Gate>
                  }
                />
                <Route
                  path="/security"
                  element={
                    <Gate nav="security">
                      <SecurityPage />
                    </Gate>
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <Gate nav="audit">
                      <AuditPage />
                    </Gate>
                  }
                />
                <Route
                  path="/developers"
                  element={<Navigate to="/developers/api" replace />}
                />
                <Route
                  path="/developers/api"
                  element={
                    <Gate nav="developers">
                      <ApiExplorerPage />
                    </Gate>
                  }
                />
                <Route
                  path="/developers/oauth"
                  element={
                    <Gate nav="developers">
                      <OauthPage />
                    </Gate>
                  }
                />
                <Route
                  path="/developers/jwt"
                  element={
                    <Gate nav="developers">
                      <JwtInspectorPage />
                    </Gate>
                  }
                />
                <Route
                  path="/developers/events"
                  element={
                    <Gate nav="developers">
                      <EventsPage />
                    </Gate>
                  }
                />
                <Route
                  path="/developers/webhooks"
                  element={
                    <Gate nav="developers">
                      <WebhooksPage />
                    </Gate>
                  }
                />
                <Route
                  path="/health"
                  element={
                    <Gate nav="health">
                      <HealthPage />
                    </Gate>
                  }
                />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
