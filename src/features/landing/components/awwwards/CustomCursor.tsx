import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface CursorState {
  isHovering: boolean;
  isClicking: boolean;
  text: string | null;
  variant: 'default' | 'link' | 'button' | 'drag' | 'view' | 'play';
}

export const CustomCursor = () => {
  const [cursorState, setCursorState] = useState<CursorState>({
    isHovering: false,
    isClicking: false,
    text: null,
    variant: 'default',
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
    // Cancel previous frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule update on next frame
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

    // Handle hover states on interactive elements
    const handleElementHover = () => {
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], [data-cursor], input, textarea, select'
      );

      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
          const cursorType = (el as HTMLElement).dataset.cursor;
          const cursorText = (el as HTMLElement).dataset.cursorText;

          setCursorState(prev => ({
            ...prev,
            isHovering: true,
            text: cursorText || null,
            variant: (cursorType as CursorState['variant']) || 'link',
          }));
        });

        el.addEventListener('mouseleave', () => {
          setCursorState(prev => ({
            ...prev,
            isHovering: false,
            text: null,
            variant: 'default',
          }));
        });
      });
    };

    // Initial setup and mutation observer for dynamic elements
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
    if (cursorState.isHovering) return 60;
    return 40;
  };

  return (
    <>
      {/* Dot - fast following */}
      <motion.div
        className="cursor-dot"
        style={{
          x: dotX,
          y: dotY,
        }}
        animate={{
          scale: cursorState.isClicking ? 0.5 : 1,
        }}
        transition={{ duration: 0.1 }}
      />

      {/* Ring - slower following */}
      <motion.div
        className="cursor-ring"
        style={{
          x: ringX,
          y: ringY,
        }}
        animate={{
          width: getRingSize(),
          height: getRingSize(),
          borderColor: cursorState.isHovering ? 'rgb(37, 99, 235)' : 'rgb(255, 255, 255)',
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Cursor text */}
      {cursorState.text && (
        <motion.div
          className="cursor-text"
          style={{
            x: ringX,
            y: ringY,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <span className="relative top-12">{cursorState.text}</span>
        </motion.div>
      )}
    </>
  );
};
