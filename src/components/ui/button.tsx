import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`bg-blue-600 hover:bg-blue-700 text-white text-sm font-light py-2 px-4 rounded transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
