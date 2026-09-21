import { AlertCircle, Inbox } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "./utils";

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loading({ label = "A carregar", size = "md", className, ...props }: LoadingProps) {
  const sizes = { sm: "size-4", md: "size-6", lg: "size-9" };
  return (
    <div role="status" className={cn("inline-flex items-center gap-2 text-sm text-ui-text-muted", className)} {...props}>
      <span aria-hidden="true" className={cn("animate-spin rounded-full border-2 border-brand-primary/25 border-r-brand-primary", sizes[size])} />
      <span>{label}</span>
    </div>
  );
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 1, className, ...props }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn("grid gap-2", className)} {...props}>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className={cn("h-4 animate-pulse rounded-ui-sm bg-ui-surface-muted", index === lines - 1 && lines > 1 && "w-3/4")} />
      ))}
    </div>
  );
}

interface StateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  role?: string;
}

function StateLayout({ title, description, icon, actionLabel, onAction, className, ...props }: StateProps) {
  return (
    <div className={cn("flex min-h-56 flex-col items-center justify-center rounded-ui-lg border border-dashed border-ui-border bg-ui-surface px-6 py-10 text-center", className)} {...props}>
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-ui-surface-muted text-ui-text-muted">{icon}</div>
      <h3 className="font-heading text-lg font-semibold text-ui-text">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-ui-text-muted">{description}</p>}
      {actionLabel && onAction && <Button className="mt-5" variant="outline" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

export function EmptyState({ icon = <Inbox className="size-6" />, ...props }: StateProps) {
  return <StateLayout icon={icon} {...props} />;
}

export function ErrorState({ icon = <AlertCircle className="size-6" />, className, ...props }: StateProps) {
  return <StateLayout role="alert" icon={icon} className={cn("border-feedback-error/30", className)} {...props} />;
}
