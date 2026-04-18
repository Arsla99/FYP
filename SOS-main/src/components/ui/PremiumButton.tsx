import { cn } from '../../lib/utils';
import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'premium';
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
  premium: cn(
    "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white",
    "hover:from-amber-400 hover:via-orange-400 hover:to-red-400",
    "shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50",
    "border-0"
  ),
  secondary: cn(
    "bg-white/[0.04] text-white",
    "hover:bg-white/[0.08]",
    "border border-white/[0.08] hover:border-white/[0.15]",
    "light:bg-black/[0.04] light:text-gray-900 light:hover:bg-black/[0.08]",
    "light:border-black/[0.08] light:hover:border-black/[0.15]"
  ),
  danger: cn(
    "bg-gradient-to-r from-red-600 to-red-700 text-white",
    "hover:from-red-500 hover:to-red-600",
    "shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
    "border-0"
  ),
  ghost: cn(
    "bg-transparent text-white/70 hover:text-white hover:bg-white/[0.04]",
    "light:text-gray-600 light:hover:text-gray-900 light:hover:bg-black/[0.04]",
    "border-0"
  ),
  outline: cn(
    "bg-transparent border border-white/[0.15] text-white",
    "hover:bg-white/[0.04] hover:border-white/[0.25]",
    "light:border-black/[0.15] light:text-gray-900 light:hover:bg-black/[0.04]",
    "light:hover:border-black/[0.25]"
  ),
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
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
          "active:scale-[0.97]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "overflow-hidden",
          glow && variant === 'primary' && "shadow-[0_0_35px_-5px_rgba(249,115,22,0.45)]",
          glow && variant === 'premium' && "shadow-[0_0_35px_-5px_rgba(245,158,11,0.45)]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Premium shine effect */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 hover:translate-x-full" />
        
        {/* Subtle top highlight */}
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {isLoading && (
          <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
        )}
        {!isLoading && leftIcon}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );

    return (
      <motion.div
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex"
      >
        {content}
      </motion.div>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export default PremiumButton;
