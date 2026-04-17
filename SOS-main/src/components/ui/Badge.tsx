import { cn } from '../../lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  className?: string;
  pulse?: boolean;
}

const variants = {
  default: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function Badge({ 
  children, 
  variant = 'default', 
  className,
  pulse = false
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        variants[variant],
        className
      )}
    >
      {pulse && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          variant === 'default' && 'bg-orange-400',
          variant === 'success' && 'bg-emerald-400',
          variant === 'warning' && 'bg-amber-400',
          variant === 'error' && 'bg-red-400',
          variant === 'info' && 'bg-blue-400',
          variant === 'purple' && 'bg-purple-400',
        )} />
      )}
      {children}
    </span>
  );
}
