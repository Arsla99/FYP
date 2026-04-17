import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isPressing?: boolean;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
}

const AlertButton: React.FC<AlertButtonProps> = ({
  onClick,
  disabled = false,
  isPressing = false,
  onMouseDown,
  onMouseUp,
}) => (
  <div className="relative flex items-center justify-center select-none">
    {/* Ripple rings — only animate when active */}
    {!disabled && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-full h-full rounded-full border-2 border-red-500/20 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-[120%] h-[120%] rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        <div className="absolute w-[140%] h-[140%] rounded-full border border-red-500/5 animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />
      </div>
    )}

    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onMouseDown}
      onTouchEnd={onMouseUp}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={`
        relative w-full h-full rounded-full flex items-center justify-center
        font-bold text-3xl sm:text-4xl tracking-wider transition-all duration-300
        bg-gradient-to-br from-red-500 to-red-700
        ${isPressing
          ? 'shadow-[0_0_80px_-10px_rgba(239,68,68,0.8)] ring-8 ring-red-500/40'
          : 'shadow-[0_0_60px_-10px_rgba(239,68,68,0.5)] ring-4 ring-red-400/30 hover:shadow-[0_0_80px_-5px_rgba(239,68,68,0.7)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
      `}
    >
      <span className="relative z-10 drop-shadow-lg text-white">SOS</span>
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-red-400/30 to-transparent pointer-events-none" />

      <AnimatePresence>
        {isPressing && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.6 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-full bg-red-400 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.button>
  </div>
);

export default AlertButton;
