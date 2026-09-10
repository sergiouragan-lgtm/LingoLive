import { useId, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./utils";

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  as?: "main" | "section" | "div";
  size?: "md" | "lg" | "xl" | "full";
  className?: string;
  children?: ReactNode;
}

const containerSizes = { md: "max-w-3xl", lg: "max-w-5xl", xl: "max-w-7xl", full: "max-w-none" };

export function PageContainer({ as: Component = "main", size = "xl", className, ...props }: PageContainerProps) {
  return <Component className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8", containerSizes[size], className)} {...props} />;
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 border-b border-ui-border pb-5 sm:flex-row sm:items-end sm:justify-between", className)} {...props}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-primary">{eyebrow}</div>}
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ui-text sm:text-3xl">{title}</h1>
        {description && <div className="mt-2 max-w-3xl text-sm text-ui-text-muted sm:text-base">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export interface TabItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  panel: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, label = "Secções", className }: TabsProps) {
  const selected = tabs.find((tab) => tab.id === value) ?? tabs[0];
  const instanceId = useId().replace(/:/g, "");
  const enabledTabs = tabs.filter((tab) => !tab.disabled);
  const selectFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>, currentId: string) => {
    if (enabledTabs.length === 0) return;
    const currentIndex = enabledTabs.findIndex((tab) => tab.id === currentId);
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % enabledTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = enabledTabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = enabledTabs[nextIndex];
    if (!next) return;
    onValueChange(next.id);
    document.getElementById(`${instanceId}-tab-${next.id}`)?.focus();
  };
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-ui-border">
        {tabs.map((tab) => (
          <button key={tab.id} id={`${instanceId}-tab-${tab.id}`} type="button" role="tab" aria-selected={tab.id === selected?.id} aria-controls={`${instanceId}-panel-${tab.id}`} tabIndex={tab.id === selected?.id ? 0 : -1} disabled={tab.disabled} onClick={() => onValueChange(tab.id)} onKeyDown={(event) => selectFromKeyboard(event, tab.id)} className={cn("relative min-h-10 shrink-0 px-3 text-sm font-medium text-ui-text-muted transition-colors hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary disabled:opacity-50", tab.id === selected?.id && "text-brand-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-primary")}>
            {tab.label}
          </button>
        ))}
      </div>
      {selected && <div id={`${instanceId}-panel-${selected.id}`} role="tabpanel" aria-labelledby={`${instanceId}-tab-${selected.id}`} tabIndex={0} className="py-5 focus:outline-none">{selected.panel}</div>}
    </div>
  );
}
