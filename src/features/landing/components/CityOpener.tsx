// ═══════════════════════════════════════════════════════════════════════════
// CITY OPENER — HOLD TO FLY VERSION
// ═══════════════════════════════════════════════════════════════════════════
// Press and hold to descend through clouds to the city

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useTransform, useMotionValue } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  flight: {
    /** Speed when holding (progress per second, 0.15 = ~7 sec total) */
    speed: 0.2,
    /** Seconds to reach full speed */
    accelerationTime: 0.6,
    /** Seconds to stop */
    decelerationTime: 0.4,
  },

  labels: [
    { text: 'MUNICH', subtitle: 'Metropolitan Area', coord: '48.1351° N, 11.5820° E', at: 0.1 },
    { text: 'MAXVORSTADT', subtitle: 'District', coord: '48.1520° N, 11.5690° E', at: 0.35 },
    { text: 'TUM', subtitle: 'Technical University', coord: '48.1497° N, 11.5679° E', at: 0.6 },
    { text: 'HVLAB', subtitle: 'Research Laboratory', coord: '48.1489° N, 11.5683° E', at: 0.82 },
  ],

  clouds: {
    fadeEnd: 0.35,
  },

  map: {
    revealStart: 0.1,
    scaleStart: 0.85,
    scaleEnd: 3,
  },

  transition: {
    fadeStart: 0.88,
    complete: 0.98,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HOLD-TO-FLY HOOK
// ─────────────────────────────────────────────────────────────────────────────

function useHoldToFly() {
  const progress = useMotionValue(0);
  const velocity = useMotionValue(0);
  const isHolding = useRef(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const startHold = useCallback(() => {
    isHolding.current = true;
  }, []);

  const endHold = useCallback(() => {
    isHolding.current = false;
  }, []);

  useEffect(() => {
    const { speed, accelerationTime, decelerationTime } = CONFIG.flight;
    const maxVelocity = speed;
    const acceleration = maxVelocity / accelerationTime;
    const deceleration = maxVelocity / decelerationTime;

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }

      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      let currentVelocity = velocity.get();
      const currentProgress = progress.get();

      if (isHolding.current && currentProgress < 1) {
        currentVelocity = Math.min(maxVelocity, currentVelocity + acceleration * deltaTime);
      } else {
        currentVelocity = Math.max(0, currentVelocity - deceleration * deltaTime);
      }

      velocity.set(currentVelocity);

      if (currentVelocity > 0) {
        const newProgress = Math.min(1, currentProgress + currentVelocity * deltaTime);
        progress.set(newProgress);
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress, velocity]);

  return { progress, velocity, startHold, endHold };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOLD INDICATOR — Pulsing circle with progress ring
// ─────────────────────────────────────────────────────────────────────────────

interface HoldIndicatorProps {
  progress: MotionValue<number>;
  velocity: MotionValue<number>;
}

const HoldIndicator: React.FC<HoldIndicatorProps> = ({ progress, velocity }) => {
  const [isActive, setIsActive] = useState(false);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const unsubProgress = progress.on('change', (p) => setPercent(Math.round(p * 100)));
    const unsubVelocity = velocity.on('change', (v) => setIsActive(v > 0.01));
    return () => {
      unsubProgress();
      unsubVelocity();
    };
  }, [progress, velocity]);

  const opacity = useTransform(progress, [0.85, 0.95], [1, 0]);
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = useTransform(progress, (p) => circumference * (1 - p));

  return (
    <motion.div
      className="fixed left-1/2 bottom-12 -translate-x-1/2 flex flex-col items-center gap-3 z-30"
      style={{ opacity }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      {/* Progress ring */}
      <div className="relative w-20 h-20">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="38"
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="2"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="38"
            fill="none"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
        </svg>

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center"
            animate={isActive ? { scale: [1, 0.9, 1] } : { scale: 1 }}
            transition={isActive ? { duration: 0.25, repeat: Infinity } : {}}
          >
            <motion.div
              className="w-6 h-6 rounded-full"
              animate={
                isActive
                  ? { backgroundColor: 'rgba(0,0,0,0.6)', scale: 1 }
                  : { backgroundColor: 'rgba(0,0,0,0.12)', scale: 0.7 }
              }
              transition={{ duration: 0.15 }}
            />
          </motion.div>
        </div>

        {/* Percentage */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
          <span className="font-mono text-[10px] text-black/35 tabular-nums">{percent}%</span>
        </div>
      </div>

      {/* Instruction */}
      <motion.div
        className="font-mono text-[11px] tracking-[0.2em] text-black/40 uppercase"
        animate={{ opacity: isActive ? 0.3 : 0.8 }}
      >
        {isActive ? 'Descending...' : 'Hold to descend'}
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CLOUDS
// ─────────────────────────────────────────────────────────────────────────────

const Clouds: React.FC<{ progress: MotionValue<number> }> = ({ progress }) => {
  const opacity = useTransform(progress, [0, CONFIG.clouds.fadeEnd], [1, 0]);
  const y1 = useTransform(progress, [0, 0.5], ['0%', '-50%']);
  const y2 = useTransform(progress, [0, 0.5], ['0%', '-70%']);
  
  // Detect mobile for performance optimization
  const isMobile = useRef(false);
  useEffect(() => {
    isMobile.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  const cloudGradient = `
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(220,220,220,0.95) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 70% 30%, rgba(235,235,235,0.9) 0%, transparent 45%),
    radial-gradient(ellipse 90% 60% at 50% 60%, rgba(245,245,245,0.85) 0%, transparent 55%),
    radial-gradient(ellipse 70% 45% at 30% 70%, rgba(230,230,230,0.9) 0%, transparent 50%),
    radial-gradient(ellipse 50% 35% at 80% 65%, rgba(240,240,240,0.8) 0%, transparent 45%)
  `;

  // On mobile: use simpler clouds with less blur
  // On desktop: use full quality
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  useEffect(() => {
    setIsMobileDevice(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  if (isMobileDevice) {
    // Mobile: simplified clouds, less blur, fewer layers
    return (
      <motion.div className="absolute inset-0 pointer-events-none z-10" style={{ opacity, willChange: 'opacity' }}>
        <motion.div
          className="absolute inset-[-20%] w-[140%] h-[140%]"
          style={{ 
            y: y1, 
            background: cloudGradient, 
            filter: 'blur(4px)',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
        <motion.div
          className="absolute inset-[-30%] w-[160%] h-[160%]"
          style={{ 
            y: y2, 
            background: cloudGradient, 
            filter: 'blur(10px)', 
            opacity: 0.6,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      </motion.div>
    );
  }

  // Desktop: full quality
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-10" style={{ opacity, willChange: 'opacity' }}>
      <motion.div
        className="absolute inset-[-20%] w-[140%] h-[140%]"
        style={{ 
          y: y1, 
          background: cloudGradient, 
          filter: 'blur(8px)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
      <motion.div
        className="absolute inset-[-30%] w-[160%] h-[160%]"
        style={{ 
          y: y2, 
          background: cloudGradient, 
          filter: 'blur(20px)', 
          opacity: 0.8,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
      <motion.div
        className="absolute inset-[-40%] w-[180%] h-[180%]"
        style={{ 
          y: y1, 
          background: cloudGradient, 
          filter: 'blur(35px)', 
          opacity: 0.6,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING LABEL
// ─────────────────────────────────────────────────────────────────────────────

interface LabelProps {
  text: string;
  subtitle: string;
  coord: string;
  focusAt: number;
  progress: MotionValue<number>;
  index: number;
}

const FloatingLabel: React.FC<LabelProps> = ({ text, subtitle, coord, focusAt, progress, index }) => {
  const windowStart = focusAt - 0.12;
  const windowEnd = focusAt + 0.15;

  const opacity = useTransform(progress, (p) => {
    if (p < windowStart) return 0;
    if (p < focusAt) return (p - windowStart) / (focusAt - windowStart);
    if (p < windowEnd) return 1 - ((p - focusAt) / (windowEnd - focusAt)) * 0.7;
    return Math.max(0, 0.3 - (p - windowEnd) * 3);
  });

  const y = useTransform(progress, (p) => {
    if (p < windowStart) return 100;
    if (p < focusAt) return 100 - ((p - windowStart) / (focusAt - windowStart)) * 100;
    return -((p - focusAt) / (1 - focusAt)) * 280;
  });

  const scale = useTransform(progress, (p) => {
    const dist = Math.abs(p - focusAt);
    return dist < 0.08 ? 1 + (0.08 - dist) * 2 : 1;
  });

  const xOffsets = ['-5vw', '6vw', '-3vw', '4vw'];

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 text-center pointer-events-none z-20"
      style={{ 
        opacity, 
        y, 
        scale, 
        x: '-50%', 
        marginLeft: xOffsets[index % xOffsets.length],
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }}
    >
      <div className="w-24 h-px bg-black/20 mx-auto mb-4" />
      <div className="font-mono text-3xl md:text-5xl font-semibold tracking-[0.15em] text-black/85 mb-2">
        {text}
      </div>
      <div className="font-mono text-xs md:text-sm tracking-[0.12em] text-black/50 uppercase mb-1">
        {subtitle}
      </div>
      <div className="font-mono text-[10px] md:text-xs tracking-wider text-black/30">{coord}</div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CITY MAP
// ─────────────────────────────────────────────────────────────────────────────

const CityMap: React.FC<{ progress: MotionValue<number>; mapUrl: string }> = ({ progress, mapUrl }) => {
  const { revealStart, scaleStart, scaleEnd } = CONFIG.map;
  const opacity = useTransform(progress, [0, revealStart, revealStart + 0.15], [0.2, 0.5, 1]);
  const scale = useTransform(progress, [0, 1], [scaleStart, scaleEnd]);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center" 
      style={{ opacity, willChange: 'opacity' }}
    >
      <motion.img
        src={mapUrl}
        alt="City Map"
        className="w-full h-full object-cover select-none pointer-events-none"
        style={{ 
          scale, 
          filter: 'contrast(2) brightness(0.88)',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          willChange: 'transform',
          transform: 'translateZ(0)', // Force GPU acceleration
        }}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION INDICATOR (top right)
// ─────────────────────────────────────────────────────────────────────────────

const LocationIndicator: React.FC<{ progress: MotionValue<number> }> = ({ progress }) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    return progress.on('change', (p) => {
      let found = '';
      for (let i = CONFIG.labels.length - 1; i >= 0; i--) {
        if (p >= CONFIG.labels[i].at - 0.05) {
          found = CONFIG.labels[i].text;
          break;
        }
      }
      setLabel(found);
    });
  }, [progress]);

  const opacity = useTransform(progress, [0.9, 1], [1, 0]);

  return (
    <motion.div
      className="fixed top-6 right-6 text-right z-30"
      style={{ opacity }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase mb-1">
        Location
      </div>
      <motion.div
        className="font-mono text-sm tracking-[0.1em] text-black/60"
        key={label}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {label || '—'}
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

const TransitionOverlay: React.FC<{ progress: MotionValue<number> }> = ({ progress }) => {
  const opacity = useTransform(progress, [CONFIG.transition.fadeStart, 1], [0, 1]);
  return <motion.div className="absolute inset-0 bg-white pointer-events-none z-40" style={{ opacity }} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface CityOpenerProps {
  onComplete: () => void;
  mapUrl: string;
}

export const CityOpener: React.FC<CityOpenerProps> = ({ onComplete, mapUrl }) => {
  const completedRef = useRef(false);
  const { progress, velocity, startHold, endHold } = useHoldToFly();

  // Trigger completion
  useEffect(() => {
    return progress.on('change', (p) => {
      if (p >= CONFIG.transition.complete && !completedRef.current) {
        completedRef.current = true;
        setTimeout(onComplete, 200);
      }
    });
  }, [progress, onComplete]);

  // Pointer events - hold behavior for all devices
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startHold();
    },
    [startHold]
  );

  const handlePointerUp = useCallback(() => endHold(), [endHold]);
  const handlePointerLeave = useCallback(() => endHold(), [endHold]);

  // Keyboard support (Space / Enter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        startHold();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') endHold();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startHold, endHold]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-white select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        touchAction: 'none', 
        cursor: 'pointer',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        perspective: 1000,
      }}
    >
      <CityMap progress={progress} mapUrl={mapUrl} />
      <Clouds progress={progress} />

      {CONFIG.labels.map((label, i) => (
        <FloatingLabel
          key={label.text}
          text={label.text}
          subtitle={label.subtitle}
          coord={label.coord}
          focusAt={label.at}
          progress={progress}
          index={i}
        />
      ))}

      <LocationIndicator progress={progress} />
      <HoldIndicator progress={progress} velocity={velocity} />
      <TransitionOverlay progress={progress} />
    </div>
  );
};