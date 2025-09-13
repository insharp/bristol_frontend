import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  textColor?: string; // new optional prop
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = "bg-blue-600",
  textColor = "text-white", // default text color
  ...props
}) => {
  return (
    <button
      className={` ${textColor} text-sm font-light py-2 px-4 rounded transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
