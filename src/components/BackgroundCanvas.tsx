import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  
  // Mouse coordinates (target and current interpolated)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check screen size
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    // Set initial mouse position in the center of the viewport
    mouseRef.current.x = window.innerWidth / 2;
    mouseRef.current.y = window.innerHeight / 2;
    mouseRef.current.targetX = window.innerWidth / 2;
    mouseRef.current.targetY = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.targetX = e.touches[0].clientX;
        mouseRef.current.targetY = e.touches[0].clientY;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const spotlight = spotlightRef.current;
    
    let animationId: number;
    let resizeObserver: ResizeObserver | null = null;
    
    // Smooth spotlight position updates (lerp)
    const updateSpotlight = () => {
      const mouse = mouseRef.current;
      // Linear interpolation: smoothly move 8% towards the target position each frame
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      if (spotlight) {
        spotlight.style.setProperty("--mouse-x", `${mouse.x}px`);
        spotlight.style.setProperty("--mouse-y", `${mouse.y}px`);
      }
    };

    // If screen is mobile size, skip creating particles
    if (isMobile || !canvas) {
      const loopOnlySpotlight = () => {
        updateSpotlight();
        animationId = requestAnimationFrame(loopOnlySpotlight);
      };
      loopOnlySpotlight();
      return () => cancelAnimationFrame(animationId);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    const particleColors = ["#CC0000", "#1A5C1A", "#FFFFFF"];

    // Initialize particles
    const initParticles = (width: number, height: number) => {
      particles = [];
      const particleCount = Math.floor((width * height) / 15000); // Dynamic density
      const limitedCount = Math.max(80, Math.min(particleCount, 120)); // Keep between 80 and 120

      for (let i = 0; i < limitedCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 3 + 1, // 1 to 4px
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          alpha: Math.random() * 0.6 + 0.2, // 0.2 to 0.8 opacity
        });
      }
    };

    // Keep canvas sized correctly
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        initParticles(width, height);
      }
    };

    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas.parentElement || document.body);

    // Main animation loop
    const animate = () => {
      updateSpotlight();

      const width = canvas.width;
      const height = canvas.height;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw connecting lines between close particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 80 * 80) { // Within 80px
            const dist = Math.sqrt(distSq);
            // Higher opacity for closer particles
            const opacity = (1 - dist / 80) * 0.12;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 2. Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Particle position update
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Repel from mouse proximity (within 100px)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 100 * 100) {
          const dist = Math.sqrt(distSq);
          if (dist > 0) {
            const forceX = dx / dist;
            const forceY = dy / dist;
            const strength = (100 - dist) * 0.08; // Stronger closer to cursor
            
            // Push particle away
            p.x += forceX * strength;
            p.y += forceY * strength;
          }
        }

        // Draw particle
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0; // Reset global alpha

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isMobile]);

  return (
    <>
      {/* 1. Mouse Spotlight Gradient Overlay */}
      <div
        ref={spotlightRef}
        className="fixed inset-0 pointer-events-none z-0 transition-[background-position] duration-100 ease-out"
        style={{
          background: "radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(10, 10, 10, 0) 0%, rgba(26, 92, 26, 0.14) 50%, rgba(204, 0, 0, 0.14) 80%, #0A0A0A 100%), #0A0A0A",
        }}
      />

      {/* 2. Floating Particle Canvas (Desktop only) */}
      {!isMobile && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-0"
        />
      )}
    </>
  );
}
