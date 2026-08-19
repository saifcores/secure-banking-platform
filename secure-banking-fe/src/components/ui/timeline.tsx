import { cn } from "@/lib/cn.ts";
import { CheckCircle2, Circle } from "lucide-react";

export function Timeline({
  steps,
}: {
  steps: { label: string; time?: string; done: boolean; current?: boolean }[];
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            {step.done ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <Circle
                className={cn(
                  "size-4",
                  step.current ? "text-accent" : "text-ink-3",
                )}
              />
            )}
            {i < steps.length - 1 ? (
              <span
                className={cn(
                  "my-1 w-px flex-1 min-h-6",
                  step.done ? "bg-success/40" : "bg-white/10",
                )}
              />
            ) : null}
          </div>
          <div className="pb-5">
            <p
              className={cn(
                "text-sm font-medium",
                step.done || step.current ? "text-ink" : "text-ink-3",
              )}
            >
              {step.label}
            </p>
            {step.time ? (
              <p className="mono text-[11px] text-ink-3">{step.time}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StatusDot({
  tone = "success",
  label,
}: {
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  label?: string;
}) {
  const color = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-accent",
    neutral: "bg-ink-3",
  }[tone];
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-2">
      <span className={cn("size-1.5 rounded-full", color)} />
      {label}
    </span>
  );
}
