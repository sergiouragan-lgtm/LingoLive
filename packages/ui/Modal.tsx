import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";
import { useDismissableLayer } from "./overlay";
import { cn } from "./utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  closeLabel?: string;
  className?: string;
}

const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md", closeLabel = "Fechar modal", className }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useDismissableLayer(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-ui-modal flex items-center justify-center p-4" role="presentation">
      <button className="absolute inset-0 cursor-default bg-ui-overlay backdrop-blur-sm" aria-hidden="true" tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={cn("relative z-10 max-h-[calc(100vh-2rem)] w-full overflow-auto rounded-ui-xl border border-ui-border bg-ui-surface shadow-ui-xl focus:outline-none", sizes[size], className)}>
        <header className="flex items-start gap-4 border-b border-ui-border p-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-heading text-xl font-semibold text-ui-text">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-ui-text-muted">{description}</p>}
          </div>
          <IconButton aria-label={closeLabel} title={closeLabel} icon={<X className="size-5" strokeWidth={2.5} />} variant="outline" onClick={onClose} />
        </header>
        <div className="p-5 text-ui-text">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-ui-border p-5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
