import { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "md" | "lg";
}

export function IconButton({
  children,
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-btnBorder text-slate-400 hover:text-slate-300";

  const sizeClasses = {
    md: "w-7 h-7 rounded-sm",
    lg: "w-10 h-10 rounded-full",
  };

  const iconSizeClasses = {
    md: "[&>svg]:w-4 [&>svg]:h-4 [&>svg]:color-textBtn",
    lg: "[&>svg]:w-6 [&>svg]:h-6",
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${iconSizeClasses[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
