// components/SlideModal.tsx
"use client";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface SlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SlideModal: React.FC<SlideModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" 
    ? createPortal(modalContent, document.body)
    : null;
};

export default SlideModal;
