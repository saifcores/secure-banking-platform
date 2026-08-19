import { canSeeNav } from "@/lib/rbac.ts";
import { cn } from "@/lib/cn.ts";
import { useAuth } from "@/auth/session.tsx";
import {
  Activity,
  BookOpen,
  ChevronLeft,
  Code2,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  ArrowLeftRight,
  Users,
  Wallet,
  Webhook,
  Radio,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const sections = [
  {
    label: null,
    items: [
      {
        to: "/overview",
        label: "Overview",
        icon: LayoutDashboard,
        nav: "overview" as const,
      },
    ],
  },
  {
    label: "Banking",
    items: [
      {
        to: "/customers",
        label: "Customers",
        icon: Users,
        nav: "customers" as const,
      },
      {
        to: "/accounts",
        label: "Accounts",
        icon: Wallet,
        nav: "accounts" as const,
      },
      {
        to: "/transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
        nav: "transactions" as const,
      },
      {
        to: "/ledger",
        label: "Ledger",
        icon: BookOpen,
        nav: "ledger" as const,
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        to: "/security",
        label: "Security Center",
        icon: Shield,
        nav: "security" as const,
      },
      {
        to: "/audit",
        label: "Audit Logs",
        icon: ScrollText,
        nav: "audit" as const,
      },
    ],
  },
  {
    label: "Developer",
    items: [
      {
        to: "/developers/api",
        label: "API Explorer",
        icon: Code2,
        nav: "developers" as const,
      },
      {
        to: "/developers/oauth",
        label: "OAuth2",
        icon: KeyRound,
        nav: "developers" as const,
      },
      {
        to: "/developers/jwt",
        label: "JWT Inspector",
        icon: Activity,
        nav: "developers" as const,
      },
      {
        to: "/developers/events",
        label: "Events",
        icon: Radio,
        nav: "developers" as const,
      },
      {
        to: "/developers/webhooks",
        label: "Webhooks",
        icon: Webhook,
        nav: "developers" as const,
      },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      {
        to: "/health",
        label: "System Health",
        icon: HeartPulse,
        nav: "health" as const,
      },
    ],
  },
];

export function Sidebar({
  collapsed,
  onCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/8 bg-navy-2/80",
        collapsed ? "w-[72px]" : "w-[232px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-white/8 px-3",
          collapsed ? "justify-center" : "gap-2.5",
        )}
      >
        <div className="flex size-8 items-center justify-center rounded-md border border-accent/30 bg-accent/10">
          <Shield className="size-4 text-accent" strokeWidth={1.7} />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-ink">
              Secure Bank
            </p>
            <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-3">
              Operations
            </p>
          </div>
        ) : null}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => {
          const items = section.items.filter((item) =>
            canSeeNav(roles, item.nav),
          );
          if (!items.length) return null;
          return (
            <div key={section.label ?? "root"} className="mb-4">
              {section.label && !collapsed ? (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  {section.label}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    title={item.label}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-ink-2 transition-colors hover:bg-white/5 hover:text-ink",
                        isActive && "bg-accent/10 text-ink",
                        collapsed && "justify-center px-0",
                      )
                    }
                  >
                    <item.icon className="size-4 shrink-0" strokeWidth={1.6} />
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/8 p-2">
        {canSeeNav(roles, "settings") ? (
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-ink-2 hover:bg-white/5 hover:text-ink",
                isActive && "bg-accent/10 text-ink",
                collapsed && "justify-center",
              )
            }
          >
            <Settings className="size-4" strokeWidth={1.6} />
            {!collapsed ? <span className="truncate">Settings</span> : null}
          </NavLink>
        ) : null}
        <button
          onClick={onCollapse}
          className="mt-1 flex w-full items-center justify-center rounded-md py-1.5 text-ink-3 hover:bg-white/5 hover:text-ink"
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>
    </aside>
  );
}
