import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "./utils";

interface FieldChromeProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

const controlClass = "w-full rounded-ui-md border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text shadow-sm transition-colors placeholder:text-ui-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

function FieldChrome({ id, label, hint, error, required, children, className }: FieldChromeProps & { children: ReactNode }) {
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ui-text">
          {label}{required && <span className="ml-1 text-feedback-error" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p id={descriptionId} className={cn("text-xs", error ? "text-feedback-error" : "text-ui-text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldChromeProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id: suppliedId, label, hint, error, required, className, ...props }, ref,
) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <FieldChrome id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input ref={ref} id={id} required={required} aria-invalid={!!error} aria-describedby={hint || error ? `${id}-description` : undefined} className={controlClass} {...props} />
    </FieldChrome>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldChromeProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id: suppliedId, label, hint, error, required, className, children, ...props }, ref,
) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <FieldChrome id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select ref={ref} id={id} required={required} aria-invalid={!!error} aria-describedby={hint || error ? `${id}-description` : undefined} className={controlClass} {...props}>{children}</select>
    </FieldChrome>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldChromeProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id: suppliedId, label, hint, error, required, className, rows = 4, ...props }, ref,
) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <FieldChrome id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea ref={ref} id={id} rows={rows} required={required} aria-invalid={!!error} aria-describedby={hint || error ? `${id}-description` : undefined} className={cn(controlClass, "resize-y")} {...props} />
    </FieldChrome>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id: suppliedId, label, description, className, ...props }, ref,
) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 text-sm text-ui-text", className)}>
      <input ref={ref} id={id} type="checkbox" className="mt-0.5 size-4 rounded border-ui-border accent-brand-primary focus:ring-brand-primary" aria-describedby={description ? `${id}-description` : undefined} {...props} />
      <span className="grid gap-0.5">
        <span className="font-medium">{label}</span>
        {description && <span id={`${id}-description`} className="text-xs text-ui-text-muted">{description}</span>}
      </span>
    </label>
  );
});
