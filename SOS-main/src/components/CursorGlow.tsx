import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';

export default function CursorGlow() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };
    
    const hideCursor = () => setIsVisible(false);
    
    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseleave', hideCursor);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseleave', hideCursor);
    };
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main glow */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div 
          className="w-[400px] h-[400px] rounded-full blur-[120px] opacity-30 transition-colors duration-500"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, rgba(239,68,68,0.2) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, rgba(239,68,68,0.1) 50%, transparent 70%)'
          }}
        />
      </motion.div>
      
      {/* Sharp center dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div 
          className="w-2 h-2 rounded-full opacity-60"
          style={{
            background: isDark ? 'rgba(249,115,22,0.8)' : 'rgba(249,115,22,0.6)'
          }}
        />
      </motion.div>
    </>
  );
}
