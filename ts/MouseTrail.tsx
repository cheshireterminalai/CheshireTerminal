import React, { useEffect, useRef } from 'react';

const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points: { x: number; y: number; age: number }[] = [];
  const maxAge = 50;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      points.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        age: 0,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = points.length - 1; i >= 0; i--) {
        const point = points[i];
        point.age++;

        if (point.age > maxAge) {
          points.splice(i, 1);
          continue;
        }

        const opacity = 1 - point.age / maxAge;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 51, 234, ${opacity})`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default MouseTrail;