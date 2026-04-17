import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text';
  lines?: number;
}

export default function Skeleton({ className, variant = 'default', lines = 1 }: SkeletonProps) {
  const base = "animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 light:from-black/5 light:via-black/10 light:to-black/5 bg-[length:200%_100%]";
  
  if (variant === 'circle') {
    return (
      <div className={cn(base, "rounded-full", className)} />
    );
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2 w-full">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(base, "h-3 rounded-md", className)} 
            style={{ width: `${85 + Math.random() * 15}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(base, "rounded-md", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4",
      className
    )}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
