import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = "font-bold rounded-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md";
  
  const variants = {
    primary: "bg-pink-400 hover:bg-pink-500 text-white border-b-4 border-pink-600 active:border-b-0 active:translate-y-1 py-3 px-6 text-lg",
    secondary: "bg-yellow-300 hover:bg-yellow-400 text-yellow-800 border-b-4 border-yellow-500 active:border-b-0 active:translate-y-1 py-2 px-4",
    icon: "bg-white hover:bg-pink-50 text-pink-500 p-3 rounded-full border-2 border-pink-200"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};