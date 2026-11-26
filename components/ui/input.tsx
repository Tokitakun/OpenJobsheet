import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", icon, disabled, type = "text", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`w-full h-11 rounded-md border border-line bg-surface text-ink text-sm placeholder:text-ink-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:bg-muted ${
            icon ? "pl-10 pr-3.5" : "px-3.5"
          } ${className}`.trim()}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
