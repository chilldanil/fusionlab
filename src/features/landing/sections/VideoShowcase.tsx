import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { MagneticButton } from '../components/awwwards/MagneticButton';

gsap.registerPlugin(ScrollTrigger);

export const VideoShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Parallax and scale transforms
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);

  // Smooth springs
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    // Text reveal on scroll
    gsap.fromTo(
      contentRef.current.querySelectorAll('.reveal-text'),
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen py-32 bg-[var(--color-black)] overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10" />

      {/* Main content */}
      <div className="container-wide relative z-20">
        {/* Header */}
        <div ref={contentRef} className="text-center mb-16">
          <motion.span
            className="reveal-text inline-block mb-6 text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase"
          >
            Experience
          </motion.span>

          <h2 className="reveal-text text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8">
            See It In Action
          </h2>

          <p className="reveal-text text-lg md:text-xl text-white/50 max-w-2xl mx-auto">
            Step inside FusionLab and experience the energy of creation.
            Where imagination meets precision engineering.
          </p>
        </div>

        {/* Video container */}
        <motion.div
          className="relative max-w-6xl mx-auto"
          style={{
            scale: smoothScale,
            y: smoothY,
            opacity,
          }}
        >
          {/* Video frame */}
          <div className="relative aspect-video overflow-hidden">
            {/* Placeholder for actual video */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
              {/* Animated grid overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Central play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <MagneticButton cursorText={isPlaying ? 'Pause' : 'Play'}>
                  <motion.button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/20 flex items-center justify-center group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Pulse effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full border border-white/10"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />

                    {/* Icon */}
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}

                    {/* Hover fill */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[var(--color-accent)]"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Icon on hover */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 1 }}
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white relative z-10" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1 relative z-10" />
                      )}
                    </motion.div>
                  </motion.button>
                </MagneticButton>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-8 left-8 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="text-xs font-mono text-white/30 uppercase">
                  {isPlaying ? 'Playing' : 'Paused'}
                </span>
              </div>

              {/* Duration bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <motion.div
                  className="h-full bg-[var(--color-accent)]"
                  initial={{ width: '0%' }}
                  animate={{ width: isPlaying ? '100%' : '0%' }}
                  transition={{
                    duration: isPlaying ? 30 : 0,
                    ease: 'linear',
                  }}
                />
              </div>
            </div>

            {/* Frame corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/20" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/20" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/20" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/20" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-4">
              <MagneticButton>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                  data-cursor="button"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
              </MagneticButton>
            </div>

            <span className="text-xs font-mono text-white/30">
              02:34 / 05:00
            </span>
          </div>
        </motion.div>

        {/* Bottom stats */}
        <div className="grid grid-cols-3 gap-8 mt-24 max-w-3xl mx-auto">
          {[
            { value: '10+', label: 'Workshop Areas' },
            { value: '1200m²', label: 'Total Space' },
            { value: '24/7', label: 'Access' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-white/40 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
