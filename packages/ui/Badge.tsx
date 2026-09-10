import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./utils";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "error" | "info";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-ui-surface-muted text-ui-text-muted",
  primary: "bg-brand-primary/10 text-brand-primary-strong",
  success: "bg-feedback-success/10 text-feedback-success-strong",
  warning: "bg-feedback-warning/10 text-feedback-warning-strong",
  error: "bg-feedback-error/10 text-feedback-error-strong",
  info: "bg-feedback-info/10 text-feedback-info-strong",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
  children?: ReactNode;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variants[variant], className)} {...props} />;
}
