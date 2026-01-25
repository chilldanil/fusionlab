import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  id: number;
  title: string;
  description: string;
  stats: { value: string; label: string }[];
}

const features: Feature[] = [
  {
    id: 1,
    title: 'Precision Manufacturing',
    description: 'Industrial-grade equipment for professional results. Our machines maintain tolerances of ±0.001mm for the most demanding projects.',
    stats: [
      { value: '±0.001mm', label: 'Tolerance' },
      { value: '50+', label: 'Materials' },
    ],
  },
  {
    id: 2,
    title: 'Expert Guidance',
    description: 'Our team of experienced engineers and makers are always available to help you overcome technical challenges.',
    stats: [
      { value: '100+', label: 'Years Combined Exp.' },
      { value: '24/7', label: 'Support' },
    ],
  },
  {
    id: 3,
    title: 'Community First',
    description: 'Join a vibrant community of innovators. Collaborate on projects, share knowledge, and grow together.',
    stats: [
      { value: '500+', label: 'Members' },
      { value: '50+', label: 'Monthly Events' },
    ],
  },
];

export const FeaturesShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress to active feature
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (progress) => {
      const featureIndex = Math.min(
        Math.floor(progress * features.length),
        features.length - 1
      );
      setActiveFeature(featureIndex);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative bg-[var(--color-black)]"
      style={{ height: `${(features.length + 1) * 100}vh` }}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background gradients */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at ${activeFeature % 2 === 0 ? '30%' : '70%'} 50%, rgba(37, 99, 235, 0.08) 0%, transparent 50%)`,
            }}
          />
        </AnimatePresence>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="container-wide h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 w-full">
            {/* Left - Text content */}
            <div className="relative">
              {/* Section label */}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block mb-8 text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase"
              >
                Why FusionLab
              </motion.span>

              {/* Feature content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8">
                    {features[activeFeature].title}
                  </h2>

                  <p className="text-xl text-white/50 leading-relaxed mb-12 max-w-lg">
                    {features[activeFeature].description}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-12">
                    {features[activeFeature].stats.map((stat, i) => (
                      <div key={i}>
                        <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                          {stat.value}
                        </div>
                        <div className="text-sm text-white/40 uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="absolute left-0 bottom-0 flex gap-3">
                {features.map((_, index) => (
                  <motion.div
                    key={index}
                    className="w-2 h-2 rounded-full transition-colors duration-300"
                    animate={{
                      backgroundColor: index === activeFeature ? 'rgb(37, 99, 235)' : 'rgba(255,255,255,0.2)',
                      scale: index === activeFeature ? 1.5 : 1,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative hidden lg:flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full aspect-square max-w-lg"
                  style={{ perspective: '1000px' }}
                >
                  {/* Decorative elements */}
                  <div className="absolute inset-0">
                    {/* Outer rotating ring */}
                    <motion.div
                      className="absolute inset-0 border border-white/5 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Middle rotating ring */}
                    <motion.div
                      className="absolute inset-8 border border-white/10 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Inner ring with accent */}
                    <motion.div
                      className="absolute inset-16 border-2 border-[var(--color-accent)]/20 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Center content */}
                    <div className="absolute inset-24 flex items-center justify-center">
                      <motion.div
                        className="w-32 h-32 bg-gradient-to-br from-[var(--color-accent)]/20 to-purple-500/20 rounded-lg"
                        animate={{
                          rotate: [0, 90, 180, 270, 360],
                          borderRadius: ['20%', '50%', '20%', '50%', '20%'],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    </div>

                    {/* Floating elements */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-white/20 rounded-full"
                        style={{
                          top: `${20 + Math.random() * 60}%`,
                          left: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                          duration: 3 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </div>

                  {/* Feature number */}
                  <div className="absolute -bottom-8 -right-8 text-[10rem] font-bold text-white/[0.02] leading-none">
                    {String(activeFeature + 1).padStart(2, '0')}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
          animate={{ opacity: activeFeature < features.length - 1 ? 1 : 0 }}
        >
          <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
            Scroll to explore
          </span>
          <motion.div
            className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </section>
  );
};
