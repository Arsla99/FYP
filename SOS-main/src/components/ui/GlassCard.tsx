import { cn } from '../../lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradientBorder?: boolean;
  hover?: boolean;
  glow?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export default function GlassCard({ 
  children, 
  className,
  gradientBorder = false,
  hover = true,
  glow = false,
  intensity = 'medium'
}: GlassCardProps) {
  const intensityStyles = {
    low: 'bg-bg-surface/80 border-border-default/60',
    medium: 'bg-bg-surface border-border-default',
    high: 'bg-bg-elevated border-border-default',
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        hover && "transition-all duration-300 hover:-translate-y-0.5",
        className
      )}
    >
      {gradientBorder && (
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-accent-gold/20 via-accent-purple/10 to-accent-gold/5 pointer-events-none">
          <div className="w-full h-full rounded-2xl bg-bg-base" />
        </div>
      )}
      <div
        className={cn(
          "relative h-full rounded-2xl border backdrop-blur-2xl",
          intensityStyles[intensity],
          hover && "hover:bg-bg-elevated hover:border-border-default",
          glow && "shadow-[0_0_50px_-15px_rgba(59,130,246,0.10)]"
        )}
        style={{
          boxShadow: glow 
            ? '0 4px 24px rgba(0,0,0,0.15), 0 0 50px -15px rgba(59,130,246,0.10), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function GlassPanel({ 
  children, 
  className,
  intensity = 'medium'
}: { 
  children: ReactNode; 
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}) {
  const intensityStyles = {
    low: 'bg-bg-surface/60 border-border-default/50',
    medium: 'bg-bg-surface/80 border-border-default/70',
    high: 'bg-bg-elevated border-border-default',
  };

  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-2xl",
        intensityStyles[intensity],
        className
      )}
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      {children}
    </div>
  );
}
