import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface StorySlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const slides: StorySlide[] = [
  {
    id: 1,
    title: 'IDEATE',
    subtitle: '01',
    description: 'Transform your vision into a tangible concept. Our design stations and collaboration spaces help you refine your ideas.',
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="32" cy="32" r="20" />
        <path d="M32 22v20M22 32h20" />
        <circle cx="32" cy="12" r="3" />
        <circle cx="32" cy="52" r="3" />
        <circle cx="12" cy="32" r="3" />
        <circle cx="52" cy="32" r="3" />
      </svg>
    ),
    color: '#3b82f6',
  },
  {
    id: 2,
    title: 'PROTOTYPE',
    subtitle: '02',
    description: 'Bring your designs to life with our advanced 3D printers, CNC machines, and laser cutters.',
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M32 8l20 12v24L32 56 12 44V20L32 8z" />
        <path d="M32 8v24l20 12" />
        <path d="M32 32L12 20" />
      </svg>
    ),
    color: '#8b5cf6',
  },
  {
    id: 3,
    title: 'ITERATE',
    subtitle: '03',
    description: 'Refine and perfect your creation through rapid prototyping and expert feedback.',
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M32 12a20 20 0 1 1-14.14 5.86" />
        <path d="M12 18l5.86-5.86L12 6" />
        <circle cx="32" cy="32" r="8" />
      </svg>
    ),
    color: '#ec4899',
  },
  {
    id: 4,
    title: 'CREATE',
    subtitle: '04',
    description: 'Manufacture your final product with precision equipment and quality materials.',
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="12" y="12" width="40" height="40" rx="4" />
        <path d="M24 32l8 8 16-16" />
      </svg>
    ),
    color: '#22c55e',
  },
];

export const StorytellingSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const totalSlides = slides.length;
    const slideHeight = window.innerHeight;

    // Create scroll trigger for each slide
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: `+=${slideHeight * totalSlides}`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress * totalSlides;
        const currentSlide = Math.min(Math.floor(progress), totalSlides - 1);
        setActiveSlide(currentSlide);
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-screen bg-[var(--color-black)] overflow-hidden"
    >
      {/* Background gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${slides[activeSlide].color}15 0%, transparent 50%)`,
          }}
        />
      </AnimatePresence>

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Progress indicator */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-4">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            className="relative"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: activeSlide === index ? 1 : 0.3 }}
          >
            <div
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: activeSlide === index ? slides[activeSlide].color : 'white',
                transform: activeSlide === index ? 'scale(1.5)' : 'scale(1)',
              }}
            />
            {activeSlide === index && (
              <motion.div
                layoutId="progress-line"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-px w-8"
                style={{ backgroundColor: slides[activeSlide].color }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center w-full max-w-6xl">
          {/* Left - Icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              {/* Icon container */}
              <div
                className="relative w-64 h-64 flex items-center justify-center"
                style={{ color: slides[activeSlide].color }}
              >
                {/* Rotating rings */}
                <motion.div
                  className="absolute inset-0 border rounded-full"
                  style={{ borderColor: `${slides[activeSlide].color}30` }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-4 border rounded-full"
                  style={{ borderColor: `${slides[activeSlide].color}20` }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-8 border rounded-full"
                  style={{ borderColor: `${slides[activeSlide].color}10` }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                />

                {/* Icon */}
                {slides[activeSlide].icon}
              </div>

              {/* Number */}
              <div
                className="absolute -bottom-8 -right-8 text-[12rem] font-bold leading-none opacity-5"
                style={{ color: slides[activeSlide].color }}
              >
                {slides[activeSlide].subtitle}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right - Text */}
          <div className="text-center lg:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Subtitle */}
                <motion.span
                  className="inline-block mb-4 text-xs font-mono tracking-widest uppercase"
                  style={{ color: slides[activeSlide].color }}
                >
                  Step {slides[activeSlide].subtitle}
                </motion.span>

                {/* Title */}
                <h3 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight">
                  {slides[activeSlide].title}
                </h3>

                {/* Description */}
                <p className="text-lg md:text-xl text-white/50 max-w-md mx-auto lg:mx-0 leading-relaxed">
                  {slides[activeSlide].description}
                </p>

                {/* Progress bar */}
                <div className="mt-12 flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 h-full"
                      style={{ backgroundColor: slides[activeSlide].color }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${((activeSlide + 1) / slides.length) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-sm font-mono text-white/30">
                    {String(activeSlide + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono uppercase tracking-widest"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Keep scrolling
      </motion.div>
    </section>
  );
};
