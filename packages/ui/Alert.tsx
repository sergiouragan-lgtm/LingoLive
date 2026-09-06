import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { IconButton } from "./Button";
import { cn } from "./utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

const variants: Record<AlertVariant, { chrome: string; icon: LucideIcon }> = {
  info: { chrome: "border-feedback-info/30 bg-feedback-info/10 text-feedback-info-strong", icon: Info },
  success: { chrome: "border-feedback-success/30 bg-feedback-success/10 text-feedback-success-strong", icon: CheckCircle2 },
  warning: { chrome: "border-feedback-warning/30 bg-feedback-warning/10 text-feedback-warning-strong", icon: AlertTriangle },
  error: { chrome: "border-feedback-error/30 bg-feedback-error/10 text-feedback-error-strong", icon: AlertCircle },
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
  onDismiss?: () => void;
}

export function Alert({ variant = "info", title, children, onDismiss, className, ...props }: AlertProps) {
  const Icon = variants[variant].icon;
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-ui-md border p-4", variants[variant].chrome, className)} {...props}>
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cn("text-sm", title && "mt-1")}>{children}</div>}
      </div>
      {onDismiss && <IconButton aria-label="Fechar alerta" icon={<X className="size-4" />} variant="ghost" size="sm" onClick={onDismiss} />}
    </div>
  );
}
