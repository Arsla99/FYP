import { cn } from '../../lib/utils';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

export default function SectionTitle({ 
  title, 
  subtitle, 
  className, 
  align = 'left',
  size = 'md',
  gradient = false
}: SectionTitleProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn(
      "mb-6",
      align === 'center' && "text-center",
      className
    )}>
      <h2 className={cn(
        sizeClasses[size],
        "font-bold tracking-tight",
        gradient ? "gradient-text" : "text-white light:text-gray-900"
      )}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn(
          "text-sm mt-1.5 leading-relaxed",
          "text-white/35 light:text-gray-500"
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
