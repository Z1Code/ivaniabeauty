"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-shimmer text-white",
  secondary: "bg-rosa-light text-rosa-dark hover:bg-rosa-light/80",
  outline:
    "border-2 border-rosa text-rosa bg-transparent hover:bg-rosa hover:text-white",
  ghost: "bg-transparent text-rosa hover:bg-rosa/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", children, className, onClick, type = "button", disabled },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      button.style.setProperty("--x", `${x}%`);
      button.style.setProperty("--y", `${y}%`);

      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "ripple rounded-full font-semibold cursor-pointer transition-colors duration-300 inline-flex items-center justify-center gap-2",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        onClick={handleClick}
        type={type}
        disabled={disabled}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
