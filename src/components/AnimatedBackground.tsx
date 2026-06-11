import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

interface Particle {
  x: number;
  y: number;
  z: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({
    x: 0,
    y: 0,
    lerpX: 0,
    lerpY: 0,
  });
  
  // Speed parameters for the 3D particle tunnel
  const speedRef = useRef({
    current: 1.5,
    decayFrames: 0,
  });

  const [isMobile, setIsMobile] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isContactPage = pathname === "/contact";

  useEffect(() => {
    // 1. Setup mobile detection
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // 2. Initialize mouse coordinates in center of screen
    mouseRef.current.x = window.innerWidth / 2;
    mouseRef.current.y = window.innerHeight / 2;
    mouseRef.current.lerpX = window.innerWidth / 2;
    mouseRef.current.lerpY = window.innerHeight / 2;

    // 3. Event listeners for mouse / touch move
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      // Mouse move speed boost (only active if not on contact page)
      if (!isContactPage) {
        speedRef.current.current = 4.0;
        speedRef.current.decayFrames = 60;
      }
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
  }, [isContactPage]);

  useEffect(() => {
    let animId: number;
    let resizeObs: ResizeObserver | null = null;
    const canvas = canvasRef.current;
    const parallax = parallaxRef.current;

    // Particle system (180 particles)
    const PARTICLE_COUNT = 180;
    const FOCAL_LENGTH = 500;
    const particles: Particle[] = [];

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: (Math.random() - 0.5) * 1600, // -800 to 800
          y: (Math.random() - 0.5) * 1200, // -600 to 600
          z: Math.random() * 1499 + 1,    // 1 to 1500
        });
      }
    };

    if (canvas && !isMobile) {
      const handleResize = (entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
        }
      };
      resizeObs = new ResizeObserver(handleResize);
      resizeObs.observe(canvas.parentElement || document.body);
      initParticles();
    }

    // Single unified animation loop (runs on client)
    const loop = () => {
      const m = mouseRef.current;
      const sp = speedRef.current;

      // Smooth lerp coordinates (0.04 factor)
      m.lerpX += (m.x - m.lerpX) * 0.04;
      m.lerpY += (m.y - m.lerpY) * 0.04;

      // 1. Update Layer 2 Glow Background
      if (parallax) {
        if (isMobile) {
          // Static CSS gradient replacement for mobile performance
          parallax.style.background = `
            radial-gradient(circle 600px at 50% 50%,
              rgba(204,0,0,0.1) 0%,
              rgba(26,107,26,0.06) 35%,
              transparent 65%)
          `;
        } else if (isContactPage) {
          // Static soft glow for white contact page
          parallax.style.background = `
            radial-gradient(circle 600px at 50% 50%,
              rgba(204,0,0,0.05) 0%,
              rgba(26,107,26,0.03) 35%,
              transparent 65%)
          `;
        } else {
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
      }

      // 2. Update and Draw Layer 3 Canvas Particles (Desktop only)
      if (canvas && !isMobile) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // Speed boost decay back to 1.5 over 60 frames (0 on contact page for no movement)
          if (isContactPage) {
            sp.current = 0;
          } else {
            if (sp.decayFrames > 0) {
              sp.decayFrames--;
              sp.current = 1.5 + (2.5 * sp.decayFrames) / 60;
            } else {
              sp.current = 1.5;
            }
          }

          // Smooth origin offset based on mouse tilt (0 on contact page for no movement)
          const originOffsetX = isContactPage ? 0 : (m.lerpX - w / 2) * 0.08;
          const originOffsetY = isContactPage ? 0 : (m.lerpY - h / 2) * 0.08;

          ctx.clearRect(0, 0, w, h);

          // Project and update all particles
          const projected: { p: Particle; sx: number; sy: number; size: number }[] = [];

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // Only update z if not on contact page (stops movement)
            if (!isContactPage) {
              p.z -= sp.current;
              if (p.z < 1) {
                p.z = 1500;
                p.x = (Math.random() - 0.5) * 1600;
                p.y = (Math.random() - 0.5) * 1200;
              }
            }

            const scale = FOCAL_LENGTH / p.z;
            const sx = p.x * scale + w / 2 + originOffsetX;
            const sy = p.y * scale + h / 2 + originOffsetY;
            const size = Math.max(0.3, scale * 1.5);

            projected.push({ p, sx, sy, size });
          }

          // Draw connection lines for particles with z < 400 (screen distance < 80px)
          ctx.lineWidth = 0.5;
          for (let i = 0; i < projected.length; i++) {
            const p1 = projected[i];
            if (p1.p.z >= 400) continue;

            for (let j = i + 1; j < projected.length; j++) {
              const p2 = projected[j];
              if (p2.p.z >= 400) continue;

              const dx = p1.sx - p2.sx;
              const dy = p1.sy - p2.sy;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < 80) {
                const opacity = (1 - dist / 80) * 0.3;
                // Render slightly softer lines on contact page
                ctx.strokeStyle = isContactPage ? `rgba(204,0,0,${opacity * 0.4})` : `rgba(204,0,0,${opacity})`;
                ctx.beginPath();
                ctx.moveTo(p1.sx, p1.sy);
                ctx.lineTo(p2.sx, p2.sy);
                ctx.stroke();
              }
            }
          }

          // Draw particles
          for (let i = 0; i < projected.length; i++) {
            const { p, sx, sy, size } = projected[i];
            let color: string;

            if (p.z < 300) {
              const alpha = 1 - p.z / 300;
              // On white contact page, white particles would be invisible, draw them as soft neutral dark gray/black
              color = isContactPage ? `rgba(0,0,0,${(alpha * 0.2).toFixed(2)})` : `rgba(255,255,255,${alpha.toFixed(2)})`;
            } else if (p.z < 700) {
              color = isContactPage ? "rgba(204,0,0,0.6)" : "rgba(204,0,0,0.8)";
            } else {
              color = isContactPage ? "rgba(26,107,26,0.4)" : "rgba(26,107,26,0.6)";
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObs?.disconnect();
    };
  }, [isMobile, isContactPage]);

  return (
    <>
      {/* Layer 1: Deep rotating conic gradient (CSS) */}
      <div
        className="animated-bg-gradient"
        style={isContactPage ? {
          background: `conic-gradient(
            from 0deg at 50% 50%,
            #FFFFFF 0deg,
            rgba(204,0,0,0.05) 60deg,
            #FFFFFF 120deg,
            rgba(26,107,26,0.05) 180deg,
            #FFFFFF 240deg,
            rgba(204,0,0,0.03) 300deg,
            #FFFFFF 360deg
          )`,
          animation: "none",
        } : undefined}
      />

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
