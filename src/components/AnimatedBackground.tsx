import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  color: string;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, lerpX: 0, lerpY: 0 });
  const speedRef = useRef({ current: 1.5, decay: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    mouseRef.current.lerpX = window.innerWidth / 2;
    mouseRef.current.lerpY = window.innerHeight / 2;
    mouseRef.current.x = window.innerWidth / 2;
    mouseRef.current.y = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      speedRef.current.current = 4;
      speedRef.current.decay = 60;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Layer 2: Mouse parallax radial glow
  useEffect(() => {
    const parallax = parallaxRef.current;
    let animId: number;

    const updateParallax = () => {
      const m = mouseRef.current;
      m.lerpX += (m.x - m.lerpX) * 0.04;
      m.lerpY += (m.y - m.lerpY) * 0.04;

      if (parallax) {
        parallax.style.background = `
          radial-gradient(circle 600px at ${m.lerpX}px ${m.lerpY}px,
            rgba(204,0,0,0.12) 0%,
            rgba(26,107,26,0.08) 35%,
            transparent 65%),
          radial-gradient(circle 150px at ${m.lerpX}px ${m.lerpY}px,
            rgba(255,255,255,0.03) 0%,
            transparent 100%)
        `;
      }

      animId = requestAnimationFrame(updateParallax);
    };

    updateParallax();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Layer 3: 3D Particle Tunnel (Desktop only)
  useEffect(() => {
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let resizeObs: ResizeObserver | null = null;

    const PARTICLE_COUNT = 180;
    const FOCAL_LENGTH = 500;
    const particles: Particle[] = [];

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: (Math.random() - 0.5) * 1600,
          y: (Math.random() - 0.5) * 1200,
          z: Math.random() * 1499 + 1,
          color: "",
        });
      }
    };

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
    };

    resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(canvas.parentElement || document.body);
    initParticles();

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const m = mouseRef.current;
      const sp = speedRef.current;

      // Decay speed boost
      if (sp.decay > 0) {
        sp.decay--;
        if (sp.decay <= 0) sp.current = 1.5;
        else sp.current = 1.5 + (sp.current - 1.5) * 0.97;
      }

      // Mouse tilt offset
      const originOffsetX = (m.lerpX - w / 2) * 0.08;
      const originOffsetY = (m.lerpY - h / 2) * 0.08;

      ctx.clearRect(0, 0, w, h);

      // Project all particles
      const projected: { p: Particle; sx: number; sy: number; size: number; idx: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z -= sp.current;
        if (p.z < 1) {
          p.z = 1500;
          p.x = (Math.random() - 0.5) * 1600;
          p.y = (Math.random() - 0.5) * 1200;
        }

        const scale = FOCAL_LENGTH / p.z;
        const sx = p.x * scale + w / 2 + originOffsetX;
        const sy = p.y * scale + h / 2 + originOffsetY;
        const size = Math.max(0.3, scale * 1.5);

        projected.push({ p, sx, sy, size, idx: i });
      }

      // Draw connection lines (particles with z < 400)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        if (projected[i].p.z >= 400) continue;
        for (let j = i + 1; j < projected.length; j++) {
          if (projected[j].p.z >= 400) continue;
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const opacity = (1 - dist / 80) * 0.3;
            ctx.strokeStyle = `rgba(204,0,0,${opacity})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const { p, sx, sy, size } of projected) {
        let color: string;
        if (p.z < 300) {
          const alpha = 1 - p.z / 300;
          color = `rgba(255,255,255,${alpha.toFixed(2)})`;
        } else if (p.z < 700) {
          color = "rgba(204,0,0,0.8)";
        } else {
          color = "rgba(26,107,26,0.6)";
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      resizeObs?.disconnect();
    };
  }, [isMobile]);

  return (
    <>
      {/* Layer 1: Deep rotating conic gradient (CSS) */}
      <div className="animated-bg-gradient" />

      {/* Layer 2: Mouse parallax radial glow */}
      <div
        ref={parallaxRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Layer 3: 3D Particle Tunnel Canvas (Desktop only) */}
      {!isMobile && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 2 }}
        />
      )}
    </>
  );
}
