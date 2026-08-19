import { cn } from "@/lib/cn.ts";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button.tsx";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[min(640px,90dvh)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-white/10 bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-ink-3">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            icon={<X className="size-4" />}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-white/8 px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        className={cn(
          "absolute inset-0 bg-navy/60 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-white/10 bg-surface shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <h2 className="min-w-0 truncate text-sm font-semibold text-ink">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close drawer"
            icon={<X className="size-4" />}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
