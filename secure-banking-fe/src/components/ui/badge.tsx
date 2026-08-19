import { cn } from "@/lib/cn.ts";
import { statusTone } from "@/lib/format.ts";
import type { ReactNode } from "react";

const tones = {
  success: "bg-success/12 text-success border-success/20",
  danger: "bg-danger/12 text-danger border-danger/20",
  warning: "bg-warning/12 text-warning border-warning/20",
  info: "bg-accent/12 text-accent border-accent/20",
  neutral: "bg-white/6 text-ink-2 border-white/10",
};

export function Badge({
  children,
  tone,
  status,
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  status?: string;
  className?: string;
}) {
  const resolved = tone ?? (status ? statusTone(status) : "neutral");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        tones[resolved],
        className,
      )}
    >
      {children}
    </span>
  );
}
