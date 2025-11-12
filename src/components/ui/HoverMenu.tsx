import { ReactNode, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface HoverMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right" | "center";
}

export function HoverMenu({
  trigger,
  children,
  align = "right",
}: HoverMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative text-textBtn" ref={menuRef}>
      {/* Trigger button with border and arrow */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-2 py-1 text-sm rounded-md border border-btnBorder hover:opacity-70 transition-all"
      >
        {trigger}
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1 ${alignClasses[align]} min-w-[200px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 animate-in fade-in duration-200`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface MenuItemProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: "default" | "danger";
  leftIcon?: ReactNode;
}

export function MenuItem({
  onClick,
  children,
  variant = "default",
  leftIcon,
}: MenuItemProps) {
  const variantClasses = {
    default: "text-slate-300 hover:text-white",
    danger: "text-red-400 hover:text-red-300",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${variantClasses[variant]} hover:bg-slate-700 flex items-center gap-2`}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
    </button>
  );
}
