import { cn } from "@/lib/utils";
import { type ReactNode, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "primary" | "ghost" | "danger" | "success" | "accent";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-surface-raised text-text-primary border border-border hover:border-border-hover",
  primary:
    "bg-accent text-white border-none shadow-[0_1px_8px_rgba(110,86,255,0.25)] hover:bg-accent-hover",
  ghost:
    "bg-transparent text-text-secondary border-none hover:text-text-primary hover:bg-surface-card",
  danger:
    "bg-risk-critical-bg text-risk-critical border border-risk-critical-border",
  success:
    "bg-success-bg text-success border-none",
  accent:
    "bg-accent-subtle text-accent-text border border-accent-border hover:bg-accent-mid",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-[11px]",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-[13px]",
  lg: "px-5 py-2.5 text-[13px]",
};

export function Button({
  variant = "default",
  size = "sm",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-[5px] rounded-button font-semibold tracking-[0.005em] transition-all duration-150 cursor-pointer font-body",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
