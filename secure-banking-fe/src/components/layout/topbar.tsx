import { useAuth } from "@/auth/session.tsx";
import { SearchCommand } from "@/components/search-command.tsx";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown.tsx";
import { TENANTS, type TenantId } from "@/types/domain.ts";
import { initials, tenantColor, tenantLabel } from "@/lib/format.ts";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const switchable = TENANTS.filter((t) => t.id !== "PLATFORM");

const notifications = [
  {
    title: "Transaction completed",
    detail: "TX-20260819-00142 · 150,000 XOF",
    time: "2 min",
  },
  {
    title: "Access denied",
    detail: "Cross-tenant resource · BANK ABIDJAN",
    time: "5 min",
  },
  {
    title: "Token refreshed",
    detail: "banking-frontend · OIDC",
    time: "12 min",
  },
];

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { user, setTenant, logout, isDemo } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!user) return null;

  const canSwitch =
    user.role === "ADMIN" || user.tenantId === "PLATFORM" || isDemo;
  const color = tenantColor(user.tenantId);

  return (
    <header className="flex h-14 min-w-0 shrink-0 items-center gap-2 border-b border-white/8 bg-navy/80 px-3 backdrop-blur md:gap-3 md:px-4">
      {onMenu ? (
        <button
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 hover:bg-white/5 md:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </button>
      ) : null}

      <Dropdown
        align="left"
        trigger={
          <button className="flex min-w-0 max-w-[42vw] shrink items-center gap-2 rounded-md border border-white/8 bg-surface px-2.5 py-1.5 text-left sm:max-w-[220px]">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold tracking-[0.04em] text-ink">
                {tenantLabel(user.tenantId)}
              </span>
              <span className="hidden truncate text-[10px] uppercase tracking-[0.14em] text-ink-3 sm:block">
                Isolated tenant
              </span>
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-ink-3" />
          </button>
        }
      >
        <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-3">
          Switch tenant
        </p>
        {switchable.map((tenant) => (
          <DropdownItem
            key={tenant.id}
            active={user.tenantId === tenant.id}
            onClick={() => {
              if (canSwitch) setTenant(tenant.id as TenantId);
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: tenant.color }}
            />
            {user.tenantId === tenant.id ? "●" : "○"} {tenant.name}
          </DropdownItem>
        ))}
        {!canSwitch ? (
          <p className="px-2.5 py-2 text-[11px] text-ink-3">
            Tenant is bound by your JWT `tenant_id` claim.
          </p>
        ) : (
          <p className="px-2.5 py-2 text-[11px] text-ink-3">
            Data is isolated per tenant. Switching does not leak other banks.
          </p>
        )}
      </Dropdown>

      <Dropdown
        align="left"
        trigger={
          <button className="hidden shrink-0 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-warning lg:inline-flex">
            Demo
            <ChevronDown className="ml-1 size-3" />
          </button>
        }
      >
        <DropdownItem active>DEMO</DropdownItem>
        <DropdownItem disabled>STAGING</DropdownItem>
        <DropdownItem disabled>PRODUCTION</DropdownItem>
        <p className="px-2.5 py-2 text-[11px] text-ink-3">
          Only DEMO is functional in this lab.
        </p>
      </Dropdown>

      <button
        onClick={() => setSearchOpen(true)}
        className="relative hidden min-w-0 flex-1 text-left lg:block"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
        <span className="flex h-9 w-full max-w-xl items-center overflow-hidden rounded-md border border-white/8 bg-surface pl-9 pr-3 text-sm text-ink-3">
          <span className="min-w-0 truncate">
            Search accounts, transactions, customers
          </span>
          <kbd className="ml-auto hidden shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] xl:inline">
            ⌘K
          </kbd>
        </span>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex size-9 items-center justify-center rounded-md text-ink-3 hover:bg-white/5 hover:text-ink lg:hidden"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>
        <Dropdown
          trigger={
            <button
              className="relative flex size-9 items-center justify-center rounded-md text-ink-3 hover:bg-white/5 hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
            </button>
          }
        >
          <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Notifications
          </p>
          {notifications.map((item) => (
            <div key={item.title} className="rounded px-2.5 py-2 text-left">
              <p className="text-sm text-ink">{item.title}</p>
              <p className="text-[11px] text-ink-3">{item.detail}</p>
              <p className="mt-0.5 text-[10px] text-ink-3">{item.time} ago</p>
            </div>
          ))}
        </Dropdown>
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 rounded-md border border-white/8 bg-surface px-1.5 py-1 md:px-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-[11px] font-semibold text-accent">
                {initials(user.firstName, user.lastName)}
              </span>
              <span className="hidden min-w-0 text-left xl:block">
                <span className="block max-w-[140px] truncate text-[12px] font-medium text-ink">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-3">
                  {user.role}
                </span>
              </span>
              <ChevronDown className="hidden size-3.5 text-ink-3 sm:block" />
            </button>
          }
        >
          <DropdownItem onClick={() => navigate("/settings")}>
            Profile & settings
          </DropdownItem>
          <DropdownItem onClick={() => void logout()}>Sign out</DropdownItem>
        </Dropdown>
      </div>
      <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
