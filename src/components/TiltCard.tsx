import { useRef, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const tiltX = (mouseY - rect.height / 2) / 10;
    const tiltY = (mouseX - rect.width / 2) / 10;

    el.style.transition = "transform 0.1s ease-out";
    el.style.transform = `perspective(800px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg) translateZ(8px)`;

    if (shineRef.current) {
      shineRef.current.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.07), transparent 60%)`;
      shineRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = "transform 0.5s ease, box-shadow 0.5s ease";
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateZ(0)";

    if (shineRef.current) {
      shineRef.current.style.opacity = "0";
    }
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card relative overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={shineRef} className="tilt-shine" />
      {children}
    </div>
  );
}
