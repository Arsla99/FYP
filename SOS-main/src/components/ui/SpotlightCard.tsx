import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glowColor?: string;
  borderGlow?: boolean;
}

export default function SpotlightCard({ 
  children, 
  className,
  hover = true,
  glowColor = 'rgba(249, 115, 22, 0.12)',
  borderGlow = true
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={hover ? { y: -3, scale: 1.002 } : undefined}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gray-900/50 backdrop-blur-2xl",
        "light:bg-white/70 light:border-black/[0.06]",
        className
      )}
      style={{
        boxShadow: hover 
          ? '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.02)'
      }}
    >
      {/* Spotlight gradient */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 55%)`,
        }}
      />
      
      {/* Subtle border glow on hover */}
      {borderGlow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500"
          style={{
            opacity: opacity * 0.6,
            boxShadow: `inset 0 0 0 1px ${glowColor}`,
          }}
        />
      )}

      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
}
