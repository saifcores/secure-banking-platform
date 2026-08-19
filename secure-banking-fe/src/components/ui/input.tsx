import { cn } from "@/lib/cn.ts";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  mono?: boolean;
};

export function Input({
  label,
  hint,
  error,
  trailing,
  mono,
  className,
  id,
  ...props
}: Props) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1.5">
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
          {label}
        </span>
      ) : null}
      <span className="relative">
        <input
          id={inputId}
          className={cn(
            "h-9 w-full rounded-md border border-white/10 bg-navy-2 px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent/60 focus:ring-2 focus:ring-accent/20",
            mono && "mono text-[12.5px]",
            trailing && "pr-9",
            error && "border-danger/50",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-3">
            {trailing}
          </span>
        ) : null}
      </span>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {hint && !error ? (
        <span className="text-xs text-ink-3">{hint}</span>
      ) : null}
    </label>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({
  label,
  error,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
          {label}
        </span>
      ) : null}
      <select
        className={cn(
          "h-9 w-full rounded-md border border-white/10 bg-navy-2 px-3 text-sm text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
