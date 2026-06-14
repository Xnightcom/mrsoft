import { type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  return (
    <div className={`tilt-card relative overflow-hidden rounded-xl ${className}`}>
      {children}
    </div>
  );
}
