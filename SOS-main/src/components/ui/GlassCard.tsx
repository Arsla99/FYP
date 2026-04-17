import { cn } from '../../lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradientBorder?: boolean;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({ 
  children, 
  className,
  gradientBorder = false,
  hover = true,
  glow = false
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        hover && "transition-all duration-300 hover:-translate-y-0.5",
        className
      )}
    >
      {gradientBorder && (
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-orange-500/40 via-red-500/20 to-orange-500/10 pointer-events-none">
          <div className="w-full h-full rounded-2xl bg-gray-950/80" />
        </div>
      )}
      <div
        className={cn(
          "relative h-full rounded-2xl border backdrop-blur-xl",
          "bg-white/[0.03] dark:bg-white/[0.03] border-white/[0.06]",
          "light:bg-white/80 light:border-black/[0.06]",
          hover && "hover:bg-white/[0.05] hover:border-white/[0.12]",
          hover && "light:hover:bg-white light:hover:border-black/[0.1]",
          glow && "shadow-[0_0_40px_-10px_rgba(249,115,22,0.15)]"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function GlassPanel({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl",
        "bg-white/[0.02] border-white/[0.05]",
        "light:bg-white/60 light:border-black/[0.05]",
        className
      )}
    >
      {children}
    </div>
  );
}
