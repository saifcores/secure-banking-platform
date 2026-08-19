import { useAuth } from "@/auth/session.tsx";
import { Sidebar } from "@/components/layout/sidebar.tsx";
import { Topbar } from "@/components/layout/topbar.tsx";
import { canSeeNav } from "@/lib/rbac.ts";
import { cn } from "@/lib/cn.ts";
import { tenantColor } from "@/lib/format.ts";
import {
  BookOpen,
  LayoutDashboard,
  ArrowLeftRight,
  Shield,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";

const mobileItems = [
  {
    to: "/overview",
    label: "Home",
    icon: LayoutDashboard,
    nav: "overview" as const,
  },
  {
    to: "/accounts",
    label: "Accounts",
    icon: Wallet,
    nav: "accounts" as const,
  },
  {
    to: "/transactions",
    label: "Tx",
    icon: ArrowLeftRight,
    nav: "transactions" as const,
  },
  { to: "/ledger", label: "Ledger", icon: BookOpen, nav: "ledger" as const },
  {
    to: "/security",
    label: "Security",
    icon: Shield,
    nav: "security" as const,
  },
];

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-navy text-ink-3">
        Validating session…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function AppShell() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const roles = user?.roles ?? [];
  const visibleMobile = mobileItems.filter((item) =>
    canSeeNav(roles, item.nav),
  );

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-navy text-ink">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5"
        style={{ background: tenantColor(user?.tenantId ?? "BANK_DAKAR") }}
      />
      <div className="hidden h-full shrink-0 md:flex">
        <Sidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed((v) => !v)}
        />
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-navy/70"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full w-[min(232px,85vw)]">
            <Sidebar
              collapsed={false}
              onCollapse={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          <div className="animate-page mx-auto w-full max-w-[1280px]">
            <Outlet />
          </div>
        </main>
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/8 bg-navy-2/95 pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {visibleMobile.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] text-ink-3",
                  isActive && "text-ink",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              <span className="w-full truncate text-center">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
