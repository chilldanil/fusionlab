/**
 * Custom Cursor for Light Theme
 * Minimal, elegant cursor that works well on white backgrounds
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface CursorState {
  isHovering: boolean;
  isClicking: boolean;
}

export const CustomCursorLight = () => {
  const [cursorState, setCursorState] = useState<CursorState>({
    isHovering: false,
    isClicking: false,
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth following
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const dotX = useSpring(mouseX, springConfig);
  const dotY = useSpring(mouseY, springConfig);

  // Slower spring for the ring
  const ringSpringConfig = { damping: 30, stiffness: 200, mass: 0.8 };
  const ringX = useSpring(mouseX, ringSpringConfig);
  const ringY = useSpring(mouseY, ringSpringConfig);

  const rafRef = useRef<number | undefined>(undefined);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    });
  }, [mouseX, mouseY]);

  const handleMouseDown = useCallback(() => {
    setCursorState(prev => ({ ...prev, isClicking: true }));
  }, []);

  const handleMouseUp = useCallback(() => {
    setCursorState(prev => ({ ...prev, isClicking: false }));
  }, []);

  useEffect(() => {
    // Check for touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    // Add cursor-none class to body
    document.body.classList.add('cursor-none');

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Handle hover states
    const handleElementHover = () => {
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], [data-cursor], input, textarea, select'
      );

      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
          setCursorState(prev => ({ ...prev, isHovering: true }));
        });

        el.addEventListener('mouseleave', () => {
          setCursorState(prev => ({ ...prev, isHovering: false }));
        });
      });
    };

    handleElementHover();

    const observer = new MutationObserver(() => {
      handleElementHover();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.body.classList.remove('cursor-none');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  // Hide on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) return null;

  const getRingSize = () => {
    if (cursorState.isClicking) return 30;
    if (cursorState.isHovering) return 50;
    return 36;
  };

  return (
    <>
      {/* Dot */}
      <motion.div
        className="cursor-dot-light"
        style={{
          x: dotX,
          y: dotY,
        }}
        animate={{
          scale: cursorState.isClicking ? 0.5 : 1,
        }}
        transition={{ duration: 0.1 }}
      />

      {/* Ring */}
      <motion.div
        className="cursor-ring-light"
        style={{
          x: ringX,
          y: ringY,
        }}
        animate={{
          width: getRingSize(),
          height: getRingSize(),
          borderColor: cursorState.isHovering ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)',
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </>
  );
};
