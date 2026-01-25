import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
  minDuration?: number;
}

export const Preloader = ({ onComplete, minDuration = 2000 }: PreloaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const startTime = Date.now();

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const elapsed = Date.now() - startTime;
        const naturalProgress = Math.min(95, prev + Math.random() * 10);

        if (elapsed >= minDuration * 0.8) {
          return Math.min(100, naturalProgress + 5);
        }
        return naturalProgress;
      });
    }, 100);

    // Ensure minimum duration
    const timeout = setTimeout(() => {
      setProgress(100);
      clearInterval(interval);

      // Start exit animation
      setTimeout(() => {
        setIsExiting(true);
      }, 300);
    }, minDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [minDuration]);

  // Text animation
  useEffect(() => {
    const chars = textRefs.current.filter(Boolean);
    if (chars.length === 0) return;

    gsap.fromTo(
      chars,
      { y: 100, opacity: 0, rotateX: 90 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: 'power3.out',
        delay: 0.3,
      }
    );
  }, []);

  const handleExitComplete = () => {
    onComplete();
  };

  const brandName = 'FUSIONLAB';

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {!isExiting && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-[9999] bg-[var(--color-black)] flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Grid pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
          </div>

          {/* Logo / Brand */}
          <div className="relative mb-16" style={{ perspective: '1000px' }}>
            <div className="flex overflow-hidden">
              {brandName.split('').map((char, i) => (
                <span
                  key={i}
                  ref={el => { textRefs.current[i] = el; }}
                  className="text-6xl md:text-8xl font-bold text-white tracking-tighter"
                  style={{
                    display: 'inline-block',
                    transformOrigin: 'center bottom',
                  }}
                >
                  {char}
                </span>
              ))}
            </div>

            {/* Underline accent */}
            <motion.div
              className="absolute -bottom-4 left-0 h-1 bg-[var(--color-accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </div>

          {/* Progress bar */}
          <div className="relative w-64 h-[2px] bg-white/10 overflow-hidden">
            <motion.div
              ref={progressRef}
              className="absolute inset-y-0 left-0 bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </div>

          {/* Progress percentage */}
          <motion.div
            className="mt-6 font-mono text-sm text-white/50 tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(progress)}%
          </motion.div>

          {/* Loading text */}
          <motion.p
            className="absolute bottom-12 text-xs text-white/30 tracking-[0.3em] uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            Loading experience
          </motion.p>

          {/* Corner decorations */}
          <div className="absolute top-8 left-8 w-8 h-8 border-l border-t border-white/20" />
          <div className="absolute top-8 right-8 w-8 h-8 border-r border-t border-white/20" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-white/20" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-white/20" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

// Curtain transition (for dramatic effect)
export const CurtainTransition = ({ children }: PageTransitionProps) => {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-[var(--color-black)] z-50 origin-bottom"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.87, 0, 0.13, 1],
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {children}
      </motion.div>
    </>
  );
};
