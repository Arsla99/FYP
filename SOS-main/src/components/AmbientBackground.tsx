import { useTheme } from '../utils/ThemeContext';

export default function AmbientBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div 
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark 
            ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
            : 'bg-gradient-to-br from-slate-50 via-white to-orange-50/30'
        }`} 
      />
      
      {/* Animated orb 1 - top left */}
      <div 
        className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-60 animate-orb-slow transition-colors duration-700 ${
          isDark ? 'bg-orange-600/20' : 'bg-orange-400/20'
        }`}
      />
      
      {/* Animated orb 2 - bottom right */}
      <div 
        className={`absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-50 animate-orb-slow-reverse transition-colors duration-700 ${
          isDark ? 'bg-red-600/15' : 'bg-rose-400/15'
        }`}
        style={{ animationDelay: '-5s' }}
      />
      
      {/* Animated orb 3 - center */}
      <div 
        className={`absolute top-[60%] left-[20%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-40 animate-orb-pulse transition-colors duration-700 ${
          isDark ? 'bg-amber-600/10' : 'bg-amber-400/20'
        }`}
        style={{ animationDelay: '-10s' }}
      />

      {/* Grid pattern overlay */}
      <div 
        className={`absolute inset-0 opacity-[0.015] transition-opacity duration-700 ${
          isDark ? 'opacity-[0.02]' : 'opacity-[0.03]'
        }`}
        style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
