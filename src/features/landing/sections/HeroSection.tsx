import { useEffect, useRef, Suspense } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { TextReveal } from '../components/awwwards/TextReveal';
import { MagneticButton, AwwwardsButton } from '../components/awwwards/MagneticButton';
import { useSmoothScroll } from '../components/awwwards/SmoothScroll';
import { ArrowDown, Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// 3D Floating Sphere
const FloatingSphere = () => {
  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={1}
    >
      <Sphere args={[1, 64, 64]} scale={2.5}>
        <MeshDistortMaterial
          color="#1a1a2e"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

// Animated grid background
const GridBackground = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    gsap.to(gridRef.current, {
      backgroundPosition: '50px 50px',
      duration: 20,
      ease: 'none',
      repeat: -1,
    });
  }, []);

  return (
    <div
      ref={gridRef}
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    />
  );
};

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  // Smooth spring physics
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  const handleScrollDown = () => {
    scrollTo('#about', { offset: -100 });
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[200vh] bg-[var(--color-black)]"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <GridBackground />

        {/* 3D Canvas */}
        <div className="absolute inset-0 z-0">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <FloatingSphere />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 z-10" />

        {/* Content */}
        <motion.div
          className="relative z-20 h-full flex flex-col justify-center container-wide"
          style={{
            y: smoothY,
            opacity: smoothOpacity,
            scale: smoothScale,
          }}
        >
          <div className="max-w-5xl">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-3 px-4 py-2 border border-white/10 rounded-full text-xs font-mono text-white/50 tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                Makerspace 2.0
              </span>
            </motion.div>

            {/* Main heading */}
            <h1 className="mb-8">
              <TextReveal
                as="span"
                className="block text-[var(--text-hero)] font-bold text-white leading-none tracking-tighter"
                splitBy="chars"
                stagger={0.03}
                delay={0.8}
              >
                BUILDING
              </TextReveal>
              <TextReveal
                as="span"
                className="block text-[var(--text-hero)] font-bold leading-none tracking-tighter"
                splitBy="chars"
                stagger={0.03}
                delay={1}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] via-purple-500 to-pink-500">
                  THE FUTURE
                </span>
              </TextReveal>
            </h1>

            {/* Subheading */}
            <TextReveal
              as="p"
              className="text-xl md:text-2xl text-white/50 max-w-2xl mb-12 leading-relaxed"
              splitBy="words"
              stagger={0.02}
              delay={1.2}
            >
              A precision-engineered workspace where ideas transform into reality.
              Where makers, engineers, and dreamers converge.
            </TextReveal>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="flex flex-wrap gap-6"
            >
              <AwwwardsButton
                variant="primary"
                size="lg"
                cursorText="Enter"
              >
                <Play className="w-4 h-4" />
                Explore Space
              </AwwwardsButton>

              <AwwwardsButton
                variant="outline"
                size="lg"
                cursorText="Learn"
              >
                Learn More
              </AwwwardsButton>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-32 right-8 hidden lg:flex flex-col gap-8"
          >
            {[
              { value: '500+', label: 'Members' },
              { value: '24/7', label: 'Access' },
              { value: '15+', label: 'Machines' },
            ].map((stat, i) => (
              <div key={i} className="text-right">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <MagneticButton onClick={handleScrollDown} cursorText="Scroll">
              <div className="flex flex-col items-center gap-4 text-white/30 hover:text-white/60 transition-colors">
                <span className="text-xs font-mono uppercase tracking-widest">Scroll</span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowDown className="w-5 h-5" />
                </motion.div>
              </div>
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Side decoration */}
        <div className="absolute top-1/2 -translate-y-1/2 right-8 hidden xl:flex flex-col items-center gap-4 z-20">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <span className="text-xs font-mono text-white/30 tracking-widest -rotate-90 whitespace-nowrap">
            SCROLL TO EXPLORE
          </span>
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </section>
  );
};
