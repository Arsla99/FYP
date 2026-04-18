import { cn } from '../../lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'premium';
  className?: string;
  pulse?: boolean;
  glow?: boolean;
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  premium: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20',
};

const glowVariants = {
  default: 'shadow-[0_0_12px_-2px_rgba(249,115,22,0.2)]',
  success: 'shadow-[0_0_12px_-2px_rgba(16,185,129,0.2)]',
  warning: 'shadow-[0_0_12px_-2px_rgba(245,158,11,0.2)]',
  error: 'shadow-[0_0_12px_-2px_rgba(239,68,68,0.2)]',
  info: 'shadow-[0_0_12px_-2px_rgba(59,130,246,0.2)]',
  purple: 'shadow-[0_0_12px_-2px_rgba(168,85,247,0.2)]',
  premium: 'shadow-[0_0_12px_-2px_rgba(245,158,11,0.25)]',
};

const dotColors = {
  default: 'bg-orange-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-blue-400',
  purple: 'bg-purple-400',
  premium: 'bg-amber-400',
};

export default function Badge({ 
  children, 
  variant = 'default', 
  className,
  pulse = false,
  glow = false,
  size = 'md'
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border backdrop-blur-sm",
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        variants[variant],
        glow && glowVariants[variant],
        className
      )}
    >
      {pulse && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          dotColors[variant]
        )} />
      )}
      {children}
    </span>
  );
}
