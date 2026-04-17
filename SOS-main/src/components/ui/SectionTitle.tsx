import { cn } from '../../lib/utils';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
}

export default function SectionTitle({ title, subtitle, className, align = 'left' }: SectionTitleProps) {
  return (
    <div className={cn(
      "mb-6",
      align === 'center' && "text-center",
      className
    )}>
      <h2 className={cn(
        "text-xl font-bold tracking-tight",
        "text-white light:text-gray-900"
      )}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn(
          "text-sm mt-1",
          "text-white/40 light:text-gray-500"
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
