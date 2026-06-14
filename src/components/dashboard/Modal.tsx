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
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
        }
        .custom-modal-card {
          background: #0F0F0F;
          border: 1px solid rgba(204,0,0,0.3);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 600px;
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          position: relative;
          margin: auto;
        }
        @media (max-width: 768px) {
          .custom-modal-card {
            padding: 20px;
            max-width: 100%;
            max-height: calc(100vh - 16px);
            border-radius: 12px 12px 0 0;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            margin: 0;
          }
        }
      `}</style>
      <div className="custom-modal-overlay" onClick={onClose}>
        <div 
          className={\`custom-modal-card \${className || ""}\`} 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(26,107,26,0.3)] pb-4">
            <h3 className="text-xl font-semibold text-white tracking-wide">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/50 hover:bg-white/5 hover:text-white transition-colors modal-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-4 text-white/90">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
