import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "neutral" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export function Badge({
  className = "",
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-mono font-medium rounded-sm border uppercase tracking-wider select-none";

  const variantStyles = {
    default: "bg-sage/40 text-primary border-primary/20",
    neutral: "bg-muted text-ink-secondary border-line",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-amber/10 text-amber border-amber/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    info: "bg-info/10 text-info border-info/30",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] leading-none",
    md: "px-2.5 py-0.5 text-xs leading-tight",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
