import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "24px 16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: "#0F0F0F",
          border: "1px solid rgba(204,0,0,0.3)",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 600,
          margin: "0 auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid rgba(26,107,26,0.3)",
            paddingBottom: 16,
            marginBottom: 20,
            paddingRight: 40,
          }}
        >
          <h3
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </h3>
        </div>

        {/* Close button — absolutely positioned */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 6,
            borderRadius: 8,
            color: "rgba(255,255,255,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
          }}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div style={{ color: "rgba(255,255,255,0.9)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
