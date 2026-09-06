import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary text-white shadow-sm hover:bg-brand-primary-dark focus-visible:ring-brand-primary",
  secondary: "bg-brand-secondary text-white shadow-sm hover:bg-brand-secondary-dark focus-visible:ring-brand-secondary",
  outline: "border border-ui-border bg-ui-surface text-ui-text hover:bg-ui-surface-muted focus-visible:ring-brand-primary",
  ghost: "bg-transparent text-ui-text hover:bg-ui-surface-muted focus-visible:ring-brand-primary",
  danger: "bg-feedback-error text-white shadow-sm hover:bg-feedback-error-strong focus-visible:ring-feedback-error",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-ui-md font-semibold transition-colors duration-ui-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ui-bg",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, "children" | "leadingIcon" | "trailingIcon"> {
  "aria-label": string;
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, className, size = "md", ...props },
  ref,
) {
  const square = size === "sm" ? "size-8 px-0" : size === "lg" ? "size-12 px-0" : "size-10 px-0";
  return <Button ref={ref} size={size} className={cn(square, className)} leadingIcon={icon} {...props} />;
});
