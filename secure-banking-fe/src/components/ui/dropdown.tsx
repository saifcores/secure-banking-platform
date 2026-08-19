import { cn } from "@/lib/cn.ts";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open ? (
        <div
          className={cn(
            "absolute z-40 mt-2 min-w-[220px] max-w-[min(320px,calc(100vw-24px))] rounded-md border border-white/10 bg-navy-2 p-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  active,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm text-ink-2 hover:bg-white/5 hover:text-ink",
        active && "bg-white/5 text-ink",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-navy-2 px-2 py-1 text-[11px] text-ink-2 shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  );
}
