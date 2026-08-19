import { cn } from "@/lib/cn.ts";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-accent text-white hover:bg-[#2563eb] shadow-[0_0_0_1px_rgb(59_130_246_/_0.35)]",
  secondary: "bg-surface-2 text-ink hover:bg-[#243049] border border-white/8",
  ghost: "bg-transparent text-ink-2 hover:bg-white/5 hover:text-ink",
  danger: "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/20",
  outline:
    "border border-white/10 text-ink-2 hover:text-ink hover:border-white/20 bg-transparent",
} as const;

const sizes = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-sm",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  disabled,
  ...props
}: Props) {
  const iconOnly = Boolean(icon) && (children === undefined || children === null || children === "");
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-[-0.01em] transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        iconOnly && size === "sm" && "w-8 px-0",
        iconOnly && size === "md" && "w-9 px-0",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
