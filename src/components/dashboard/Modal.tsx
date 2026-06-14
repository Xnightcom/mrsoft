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
    <>
      <style>{`
        .custom-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px 16px;
        }
        .custom-modal-card {
          background: #0F0F0F;
          border: 1px solid rgba(204,0,0,0.3);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }
        @media (max-width: 768px) {
          .custom-modal-card {
            padding: 20px;
            border-radius: 12px;
          }
        }
      `}</style>
      <div 
        className="custom-modal-overlay" 
        onClick={(e) => {
          // Only close if clicking the overlay itself
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className={`custom-modal-card ${className || ""}`}>
          {/* Header */}
          <div className="border-b border-[rgba(26,107,26,0.3)] pb-4 mb-4 pr-8">
            <h3 className="text-xl font-semibold text-white tracking-wide">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              style={{ position: 'absolute', top: 16, right: 16 }}
              className="rounded-lg p-1 text-white/50 hover:bg-white/5 hover:text-white transition-colors modal-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="text-white/90">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
