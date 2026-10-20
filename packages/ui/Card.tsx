import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, ...props }, ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-ui-lg border border-ui-border bg-ui-surface text-ui-text shadow-ui-sm",
        interactive && "transition duration-ui-normal hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-ui-md",
        className,
      )}
      {...props}
    />
  );
});

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("grid gap-1.5 p-5 pb-0", className)} {...props} />;
export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn("font-heading text-lg font-semibold text-ui-text", className)} {...props} />;
export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => <p className={cn("text-sm text-ui-text-muted", className)} {...props} />;
export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("p-5", className)} {...props} />;
export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />;
