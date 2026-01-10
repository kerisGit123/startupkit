"use client";

interface ThemeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ThemeButton({ 
  children, 
  onClick, 
  variant = "primary",
  size = "md",
  className = ""
}: ThemeButtonProps) {
  const baseStyles = "font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variantStyles = {
    primary: "bg-theme-primary hover:bg-theme-primary-dark text-white shadow-sm hover:shadow",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
    outline: "border-2 border-theme-primary text-theme-primary hover:bg-theme-primary-light"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
