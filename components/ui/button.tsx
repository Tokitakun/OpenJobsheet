import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-hover shadow-xs border border-transparent",
      secondary:
        "bg-surface text-ink border border-line-strong hover:bg-muted active:bg-muted shadow-xs",
      outline:
        "bg-transparent text-ink border border-line-strong hover:bg-muted hover:border-ink/20 active:bg-muted",
      ghost:
        "bg-transparent text-ink-secondary hover:text-ink hover:bg-muted active:bg-muted",
      danger:
        "bg-danger text-white hover:bg-danger/90 active:bg-danger/95 shadow-xs border border-transparent",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
