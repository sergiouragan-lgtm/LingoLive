import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { IconButton } from "./Button";
import { cn } from "./utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

const variants: Record<AlertVariant, { chrome: string; accent: string; icon: LucideIcon }> = {
  info: { chrome: "border-feedback-info/40 bg-feedback-info/10", accent: "text-feedback-info-strong", icon: Info },
  success: { chrome: "border-feedback-success/40 bg-feedback-success/10", accent: "text-feedback-success-strong", icon: CheckCircle2 },
  warning: { chrome: "border-feedback-warning/40 bg-feedback-warning/10", accent: "text-feedback-warning-strong", icon: AlertTriangle },
  error: { chrome: "border-feedback-error/40 bg-feedback-error/10", accent: "text-feedback-error-strong", icon: AlertCircle },
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
  onDismiss?: () => void;
}

export function Alert({ variant = "info", title, children, onDismiss, className, ...props }: AlertProps) {
  const Icon = variants[variant].icon;
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-ui-md border p-4 text-ui-text", variants[variant].chrome, className)} {...props}>
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", variants[variant].accent)} />
      <div className="min-w-0 flex-1">
        {title && <div className={cn("font-semibold", variants[variant].accent)}>{title}</div>}
        {children && <div className={cn("text-sm text-ui-text", title && "mt-1")}>{children}</div>}
      </div>
      {onDismiss && <IconButton aria-label="Fechar alerta" icon={<X className="size-4" />} variant="ghost" size="sm" onClick={onDismiss} />}
    </div>
  );
}
