import { cn } from '../../lib/utils';
import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  glow?: boolean;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-gradient-to-r from-orange-500 to-red-600 text-white",
    "hover:from-orange-400 hover:to-red-500",
    "shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40",
    "border-0"
  ),
  secondary: cn(
    "bg-white/5 text-white",
    "hover:bg-white/10",
    "border border-white/10 hover:border-white/20",
    "light:bg-black/5 light:text-gray-900 light:hover:bg-black/10",
    "light:border-black/10 light:hover:border-black/20"
  ),
  danger: cn(
    "bg-gradient-to-r from-red-600 to-red-700 text-white",
    "hover:from-red-500 hover:to-red-600",
    "shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
    "border-0"
  ),
  ghost: cn(
    "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
    "light:text-gray-600 light:hover:text-gray-900 light:hover:bg-black/5",
    "border-0"
  ),
  outline: cn(
    "bg-transparent border border-white/20 text-white",
    "hover:bg-white/5 hover:border-white/30",
    "light:border-black/20 light:text-gray-900 light:hover:bg-black/5",
    "light:hover:border-black/30"
  ),
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3.5 text-base gap-2.5",
};

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    glow = false,
    className,
    disabled,
    ...props
  }, ref) => {
    const content = (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center",
          "font-semibold rounded-xl",
          "transition-all duration-200",
          "active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "overflow-hidden",
          glow && variant === 'primary' && "shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Shine effect */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
        
        {isLoading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {!isLoading && leftIcon}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );

    return (
      <motion.div
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ duration: 0.15 }}
        className="inline-flex"
      >
        {content}
      </motion.div>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export default PremiumButton;
