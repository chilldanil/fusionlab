/**
 * AWWWARDS LANDING PAGE
 * Original design 1:1 with premium animation stack
 * - Lenis smooth scroll
 * - GSAP ScrollTrigger
 * - Text reveal animations
 * - Custom cursor
 * - Film grain
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

import { Button } from '../../shared/ui/Button';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';

// Import existing components
import { Navbar } from './components/Navbar';
import { AnimatedCircuitBackground } from './components/AnimatedCircuitBackground';
import { Footer } from './components/Footer';
import { HorizontalScrollSection } from './components/HorizontalScrollSection';
import citySvg from './components/CitySvg03_01_NoColored.svg?url';

// Awwwards components
import { SmoothScrollProvider } from './components/awwwards/SmoothScroll';
import { CustomCursorLight } from './components/awwwards/CustomCursorLight';
import { CSSGrainLight } from './components/awwwards/FilmGrainLight';

// Import light theme styles
import './styles/awwwards-light.css';

gsap.registerPlugin(ScrollTrigger);

// Lazy load heavy components
const MapSection = lazy(() =>
  import('./components/MapSection').then((module) => ({ default: module.MapSection }))
);
const CityOpener = lazy(() =>
  import('./components/CityOpener').then((module) => ({ default: module.CityOpener }))
);
const BuildingModel = lazy(() =>
  import('./components/BuildingModel').then((module) => ({ default: module.BuildingModel }))
);

// Loading fallback
const LoadingFallback = () => (
  <div className="h-screen flex items-center justify-center bg-white">
    <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent" />
  </div>
);

// Hero text reveal component
const HeroTextReveal = ({ children, delay = 0 }: { children: string; delay?: number }) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const split = new SplitType(textRef.current, {
      types: 'chars',
      tagName: 'span',
    });

    if (split.chars) {
      gsap.fromTo(
        split.chars,
        {
          y: 100,
          opacity: 0,
          rotateX: 90,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.02,
          delay,
          ease: 'power3.out',
        }
      );
    }

    return () => {
      split.revert();
    };
  }, [delay]);

  return (
    <span ref={textRef} style={{ perspective: '1000px' }}>
      {children}
    </span>
  );
};

export const AwwwardsLandingPage = () => {
  const navigate = useNavigate();
  const [showOpener, setShowOpener] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const [prefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const handleLogin = () => navigate('/login');
  const handleDocumentation = () => navigate('/design');

  // Manage scroll for opener
  useEffect(() => {
    if (showOpener) {
      window.history.scrollRestoration = 'manual';
      document.body.style.overflow = 'hidden';
    } else {
      window.history.scrollRestoration = 'auto';
      document.body.style.overflow = '';
    }

    return () => {
      window.history.scrollRestoration = 'auto';
      document.body.style.overflow = '';
    };
  }, [showOpener]);

  const handleOpenerComplete = () => {
    setShowOpener(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Delay to allow smooth scroll to initialize
      setTimeout(() => setIsReady(true), 100);
    });
  };

  // Hero parallax effect
  useEffect(() => {
    if (!heroRef.current || showOpener || !isReady) return;

    const hero = heroRef.current;

    gsap.to(hero, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [showOpener, isReady]);

  return (
    <AnimatePresence mode="wait">
      {showOpener ? (
        <motion.div
          key="opener"
          exit={{ opacity: 0 }}
          transition={{ duration: 0 }}
        >
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <CityOpener onComplete={handleOpenerComplete} mapUrl={citySvg} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <SmoothScrollProvider>
            {/* Custom cursor for light theme */}
            {!prefersReducedMotion && <CustomCursorLight />}

            {/* Very subtle film grain */}
            {!prefersReducedMotion && <CSSGrainLight />}

            <div className="bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden relative">
              {/* Hero Section - Sticky for parallax effect */}
              <div className="sticky top-0 h-screen z-10">
                <div ref={heroRef} className="relative h-full">
                  {!prefersReducedMotion && <AnimatedCircuitBackground />}

                  <Navbar />

                  {/* Hero Content */}
                  <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto h-full flex flex-col justify-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="max-w-4xl"
                    >
                      {/* Badge */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-block mb-6 px-3 py-1 border border-gray-200 rounded-full text-xs font-mono text-gray-500 uppercase tracking-widest"
                      >
                        v2.0 System Architecture
                      </motion.div>

                      {/* Main heading with text reveal */}
                      <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-8">
                        {isReady ? (
                          <>
                            <HeroTextReveal delay={0.3}>ENGINEERING</HeroTextReveal>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                              <HeroTextReveal delay={0.5}>THE FUTURE</HeroTextReveal>
                            </span>
                          </>
                        ) : (
                          <>
                            ENGINEERING <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                              THE FUTURE
                            </span>
                          </>
                        )}
                      </h1>

                      {/* Subtitle */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-12 font-light leading-relaxed"
                      >
                        A precision-engineered workspace for creators, innovators, and builders.
                        Designed for the next generation of technical excellence.
                      </motion.p>

                      {/* CTA Buttons with magnetic effect */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        className="flex flex-wrap gap-4"
                      >
                        <Button
                          onClick={handleLogin}
                          className="h-12 px-8 text-lg magnetic-wrap"
                          data-cursor="button"
                        >
                          Access Portal
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDocumentation}
                          className="h-12 px-8 text-lg magnetic-wrap"
                          data-cursor="button"
                        >
                          Documentation
                        </Button>
                      </motion.div>
                    </motion.div>

                    {/* 3D Model Section */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[80vh] hidden lg:block"
                    >
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <BuildingModel />
                        </Suspense>
                      </ErrorBoundary>
                    </motion.div>
                  </main>
                </div>
              </div>

              {/* Horizontal Scroll Buildings Section - overlaps hero */}
              <HorizontalScrollSection
                svgUrl="/3buildings.svg"
                title="Infrastructure Blueprint"
                subtitle="ARCHITECTURAL VISION"
              />

              {/* Map Section */}
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <MapSection />
                </Suspense>
              </ErrorBoundary>

              {/* Footer */}
              <Footer />
            </div>
          </SmoothScrollProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AwwwardsLandingPage;
