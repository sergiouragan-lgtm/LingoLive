import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "./utils";

export interface DropdownItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  label?: string;
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, items, label = "Abrir menu", align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-ui-md border border-ui-border bg-ui-surface px-3 text-sm font-medium text-ui-text shadow-sm hover:bg-ui-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
        {trigger}<ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id={menuId} role="menu" className={cn("absolute top-full z-ui-dropdown mt-2 min-w-48 rounded-ui-md border border-ui-border bg-ui-surface p-1 shadow-ui-lg", align === "right" ? "right-0" : "left-0")}>
          {items.map((item) => (
            <button key={item.id} type="button" role="menuitem" disabled={item.disabled} onClick={() => { item.onSelect(); setOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-ui-sm px-3 py-2 text-left text-sm text-ui-text hover:bg-ui-surface-muted focus:bg-ui-surface-muted focus:outline-none disabled:opacity-50", item.danger && "text-feedback-error")}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
