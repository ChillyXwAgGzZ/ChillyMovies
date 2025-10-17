import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Reusable Button component
 * Prepared for design system integration (Tailwind/CSS-in-JS)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClasses: Record<ButtonVariant, string> = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      danger: "btn-danger",
      ghost: "btn-ghost",
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "btn-sm",
      md: "btn-md",
      lg: "btn-lg",
    };

    const classes = [
      "btn",
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? "btn-full-width" : "",
      isLoading ? "btn-loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <span className="btn-spinner">⏳</span>}
        {!isLoading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
        <span className="btn-content">{children}</span>
        {!isLoading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
