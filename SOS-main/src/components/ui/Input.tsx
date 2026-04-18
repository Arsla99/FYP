import { cn } from '../../lib/utils';
import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  className?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, leftIcon, rightIcon, error, className, hint, ...props }, ref) => {
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label className="block text-xs font-semibold text-white/50 light:text-gray-600 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 light:text-gray-400 group-focus-within:text-orange-400/70 transition-colors duration-200">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full px-4 py-3.5 rounded-xl text-sm",
              "bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25",
              "light:bg-black/[0.03] light:border-black/10 light:text-gray-900 light:placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50",
              "hover:border-white/[0.14] light:hover:border-black/20",
              "transition-all duration-200",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 light:text-gray-400 group-focus-within:text-orange-400/70 transition-colors duration-200">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-white/30 light:text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
