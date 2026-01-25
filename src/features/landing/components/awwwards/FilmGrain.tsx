import { useEffect, useRef } from 'react';

interface FilmGrainProps {
  opacity?: number;
  animate?: boolean;
}

export const FilmGrain = ({ opacity = 0.03, animate = true }: FilmGrainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationId: number;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255;   // A
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const render = () => {
      frame++;

      // Only update every few frames for performance
      if (animate && frame % 4 === 0) {
        generateNoise();
      }

      animationId = requestAnimationFrame(render);
    };

    resize();
    generateNoise();

    if (animate) {
      render();
    }

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9998]"
      style={{
        opacity,
        mixBlendMode: 'overlay',
      }}
    />
  );
};

// Alternative CSS-based grain (lighter performance)
export const CSSGrain = ({ opacity = 0.03 }: { opacity?: number }) => {
  // Check for reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return null;

  return (
    <div
      className="grain"
      style={{ '--noise-opacity': opacity } as React.CSSProperties}
    />
  );
};
