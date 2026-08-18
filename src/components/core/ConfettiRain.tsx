import React, { useEffect, useRef } from "react";

interface ConfettiRainProps {
  active: boolean;
  duration?: number; // duration of emission in milliseconds
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "triangle";
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = [
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#a855f7", // Purple
];

export const ConfettiRain: React.FC<ConfettiRainProps> = ({
  active,
  duration = 4500,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const isEmittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!active) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI canvas resolution
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles array
    particlesRef.current = [];
    startTimeRef.current = Date.now();
    isEmittingRef.current = true;

    const createParticle = (fromSides = false): Particle => {
      const size = Math.random() * 8 + 6;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shapes: Array<"circle" | "square" | "triangle"> = ["circle", "square", "triangle"];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      // If emitting from sides (like a cannon), configure horizontal velocity
      let x = Math.random() * window.innerWidth;
      let y = -20;
      let speedX = Math.random() * 4 - 2;
      let speedY = Math.random() * 4 + 3;

      if (fromSides) {
        const leftSide = Math.random() < 0.5;
        x = leftSide ? -10 : window.innerWidth + 10;
        y = window.innerHeight * (0.3 + Math.random() * 0.4);
        speedX = leftSide ? Math.random() * 8 + 4 : -(Math.random() * 8 + 4);
        speedY = -(Math.random() * 5 + 5);
      }

      return {
        x,
        y,
        size,
        color,
        shape,
        speedX,
        speedY,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3,
        opacity: 1,
      };
    };

    // Pre-populate some falling particles initially
    for (let i = 0; i < 80; i++) {
      const p = createParticle();
      p.y = Math.random() * window.innerHeight; // scatter vertically
      particlesRef.current.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const elapsed = Date.now() - (startTimeRef.current || 0);
      if (elapsed > duration) {
        isEmittingRef.current = false;
      }

      // Add new particles if still emitting
      if (isEmittingRef.current && particlesRef.current.length < 180) {
        // Normal top rain particles
        particlesRef.current.push(createParticle());
        
        // Occasional cannon particles from sides
        if (Math.random() < 0.2) {
          particlesRef.current.push(createParticle(true));
        }
      }

      // Update and draw particles
      particlesRef.current.forEach((p, idx) => {
        // Apply wind and gravity
        p.speedY += 0.12; // gravity
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Slow deceleration on horizontal speed
        p.speedX *= 0.98;

        // Fade out if near bottom of screen or time has elapsed
        if (!isEmittingRef.current) {
          p.opacity -= 0.015;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.shape === "circle") {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "triangle") {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // Remove off-screen or faded-out particles
      particlesRef.current = particlesRef.current.filter(
        (p) => p.y < window.innerHeight + 30 && p.x > -50 && p.x < window.innerWidth + 50 && p.opacity > 0
      );

      // Check if finished
      if (particlesRef.current.length === 0 && !isEmittingRef.current) {
        if (onComplete) {
          onComplete();
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[110]"
    />
  );
};
