import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay with background blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Centered card */}
      <div className={`relative z-10 w-full transform overflow-hidden rounded-xl border border-[#CC0000]/30 bg-[#0F0F0F] p-6 shadow-[0_0_30px_rgba(204,0,0,0.2)] transition-all md:p-8 animate-in fade-in-50 zoom-in-95 duration-200 ${className || "max-w-lg"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(26,107,26,0.3)] pb-4">
          <h3 className="text-xl font-semibold text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1 text-white/90">
          {children}
        </div>
      </div>
    </div>
  );
}
