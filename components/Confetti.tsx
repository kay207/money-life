import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  isActive: boolean;
}

export const Confetti: React.FC<ConfettiProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 2,
        rotation: Math.random() * 360
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let activeCount = 0;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += 2;

        if (p.y < canvas.height) activeCount++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
};