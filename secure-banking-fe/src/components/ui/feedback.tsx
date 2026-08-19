import { cn } from "@/lib/cn.ts";
import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button.tsx";

function highlightJson(value: string) {
  return value.replace(
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(\btrue\b|\bfalse\b)|(\bnull\b)|(-?\d+(?:\.\d+)?)/g,
    (match, key, str, bool, nul, num) => {
      if (key) return `<span class="text-teal">${key}</span>:`;
      if (str) return `<span class="text-warning">${str}</span>`;
      if (bool) return `<span class="text-accent">${bool}</span>`;
      if (nul) return `<span class="text-ink-3">${nul}</span>`;
      if (num) return `<span class="text-success">${num}</span>`;
      return match;
    },
  );
}

export function CodeBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const formatted = (() => {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      return code;
    }
  })();

  return (
    <pre
      className={cn(
        "max-w-full overflow-x-auto rounded-md border border-white/8 bg-navy-2 p-4 font-mono text-[12px] leading-relaxed text-ink-2",
        className,
      )}
    >
      <code dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }} />
    </pre>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Inbox className="mb-3 size-6 text-ink-3" strokeWidth={1.5} />
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-3">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load data",
  description = "Something went wrong while retrieving the data.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <AlertTriangle className="mb-3 size-6 text-danger" strokeWidth={1.5} />
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-3">{description}</p>
      {onRetry ? (
        <Button
          className="mt-4"
          variant="secondary"
          size="sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}
