import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";
import { useDismissableLayer } from "./overlay";
import { cn } from "./utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
  closeLabel?: string;
  className?: string;
}

export function Drawer({ open, onClose, title, description, children, footer, side = "right", closeLabel = "Fechar painel", className }: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useDismissableLayer(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-ui-drawer" role="presentation">
      <button className="absolute inset-0 cursor-default bg-ui-overlay backdrop-blur-sm" aria-label={closeLabel} onClick={onClose} />
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={cn("absolute inset-y-0 flex w-full max-w-md flex-col border-ui-border bg-ui-surface shadow-ui-xl focus:outline-none", side === "right" ? "right-0 border-l" : "left-0 border-r", className)}>
        <header className="flex items-start gap-4 border-b border-ui-border p-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-heading text-xl font-semibold text-ui-text">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-ui-text-muted">{description}</p>}
          </div>
          <IconButton aria-label={closeLabel} icon={<X className="size-5" />} variant="ghost" onClick={onClose} />
        </header>
        <div className="flex-1 overflow-auto p-5 text-ui-text">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-ui-border p-5">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
