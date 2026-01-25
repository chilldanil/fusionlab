import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';

// Core components
import {
  SmoothScrollProvider,
  CustomCursor,
  Preloader,
  CSSGrain,
  AwwwardsNavbar,
} from './components/awwwards';

// Import styles
import './styles/awwwards.css';

// Lazy load sections for better performance
const HeroSection = lazy(() =>
  import('./sections/HeroSection').then(m => ({ default: m.HeroSection }))
);
const AboutSection = lazy(() =>
  import('./sections/AboutSection').then(m => ({ default: m.AboutSection }))
);
const StorytellingSection = lazy(() =>
  import('./sections/StorytellingSection').then(m => ({ default: m.StorytellingSection }))
);
const ServicesSection = lazy(() =>
  import('./sections/ServicesSection').then(m => ({ default: m.ServicesSection }))
);
const GallerySection = lazy(() =>
  import('./sections/GallerySection').then(m => ({ default: m.GallerySection }))
);
const FeaturesShowcase = lazy(() =>
  import('./sections/FeaturesShowcase').then(m => ({ default: m.FeaturesShowcase }))
);
const TeamSection = lazy(() =>
  import('./sections/TeamSection').then(m => ({ default: m.TeamSection }))
);
const TestimonialsSection = lazy(() =>
  import('./sections/TestimonialsSection').then(m => ({ default: m.TestimonialsSection }))
);
const VideoShowcase = lazy(() =>
  import('./sections/VideoShowcase').then(m => ({ default: m.VideoShowcase }))
);
const ContactSection = lazy(() =>
  import('./sections/ContactSection').then(m => ({ default: m.ContactSection }))
);
const FooterSection = lazy(() =>
  import('./sections/FooterSection').then(m => ({ default: m.FooterSection }))
);

// Loading fallback
const SectionLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-black)]">
    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
  </div>
);

export const AwwwardsLandingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [prefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Prevent scroll during loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  const handlePreloaderComplete = () => {
    setIsLoading(false);
    // Scroll to top after preloader
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      {/* Preloader */}
      <AnimatePresence>
        {isLoading && (
          <Preloader
            onComplete={handlePreloaderComplete}
            minDuration={prefersReducedMotion ? 500 : 2500}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      {!isLoading && (
        <SmoothScrollProvider>
          {/* Custom cursor (desktop only) */}
          {!prefersReducedMotion && <CustomCursor />}

          {/* Film grain overlay */}
          {!prefersReducedMotion && <CSSGrain opacity={0.025} />}

          {/* Navigation */}
          <AwwwardsNavbar />

          {/* Main content */}
          <main className="relative bg-[var(--color-black)]">
            <Suspense fallback={<SectionLoader />}>
              {/* Hero with 3D and parallax */}
              <HeroSection />

              {/* About with stats and parallax */}
              <AboutSection />

              {/* Pinned storytelling scroll */}
              <StorytellingSection />

              {/* Services grid with 3D cards */}
              <div id="services">
                <ServicesSection />
              </div>

              {/* Horizontal scroll gallery */}
              <div id="gallery">
                <GallerySection />
              </div>

              {/* Features showcase with scroll-linked animations */}
              <FeaturesShowcase />

              {/* Team section */}
              <TeamSection />

              {/* Video showcase */}
              <VideoShowcase />

              {/* Testimonials with marquee */}
              <TestimonialsSection />

              {/* Contact form */}
              <ContactSection />

              {/* Footer */}
              <FooterSection />
            </Suspense>
          </main>
        </SmoothScrollProvider>
      )}
    </>
  );
};

export default AwwwardsLandingPage;
