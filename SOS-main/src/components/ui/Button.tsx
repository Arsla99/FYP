import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:scale-105',
    ghost: 'bg-transparent border border-gray-700 text-white hover:bg-gray-800',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg',
    success: 'bg-gradient-to-r from-green-400 to-lime-500 text-white shadow-lg',
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
