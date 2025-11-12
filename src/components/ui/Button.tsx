import { Link } from "wouter";
import { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  size?: "md" | "lg";
  fullWidth?: boolean;
  href?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  href,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-btnBorder";

  const variantClasses = {
    primary: "bg-primary hover:bg-primary-hover text-white",
    outline: "border border-primary text-primary hover:bg-primary/10",
    icon: "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white",
  };

  const sizeClasses = {
    md: "px-2 py-1 text-sm rounded-md gap-2",
    lg: "px-4 py-2 text-base rounded-full gap-2",
  };

  const widthClasses = fullWidth ? "w-full" : "";

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`;

  const content = (
    <>
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href}>
        <a className={classes}>{content}</a>
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {content}
    </button>
  );
}
