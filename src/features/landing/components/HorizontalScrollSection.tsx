import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { useDebouncedResize } from '../../../shared/hooks/useDebouncedResize';

interface HorizontalScrollSectionProps {
  svgUrl: string;
  title?: string;
  subtitle?: string;
}

type ScrollTriggerType = typeof import('gsap/ScrollTrigger').ScrollTrigger;

type GsapModule = typeof import('gsap');

type GsapInstance = GsapModule['gsap'] | GsapModule['default'];
type GsapContext = ReturnType<GsapInstance['context']>;

export const HorizontalScrollSection = ({ svgUrl, title, subtitle }: HorizontalScrollSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgNaturalRef = useRef<{ width: number; height: number } | null>(null);
  const scrollTriggerRef = useRef<ScrollTriggerType | null>(null);
  const contextRef = useRef<GsapContext | null>(null);
  const [progress, setProgress] = useState(0);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const computeSvgDimensions = useCallback((naturalWidth: number, naturalHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const isMobile = viewportWidth < 768;

    const minHeight = viewportHeight * (isMobile ? 1.15 : 0.8);
    const minWidth = viewportWidth * (isMobile ? 7.8 : 2.5);

    const heightScale = minHeight / naturalHeight;
    const widthScale = minWidth / naturalWidth;
    const scale = Math.max(heightScale, widthScale);

    return {
      width: naturalWidth * scale,
      height: naturalHeight * scale,
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      svgNaturalRef.current = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      setSvgDimensions(computeSvgDimensions(img.naturalWidth, img.naturalHeight));
    };
    img.src = svgUrl;
  }, [computeSvgDimensions, svgUrl]);

  useEffect(() => {
    if (!sectionRef.current || !svgContainerRef.current || svgDimensions.width === 0) return;

    let isMounted = true;

    const setup = async () => {
      const gsapModule = (await import('gsap')) as GsapModule;
      const scrollModule = await import('gsap/ScrollTrigger');
      const gsap = (gsapModule.gsap || gsapModule.default) as GsapInstance;
      const ScrollTrigger = (scrollModule.ScrollTrigger || scrollModule.default) as ScrollTriggerType;

      if (!isMounted || !gsap || !ScrollTrigger) return;

      gsap.registerPlugin(ScrollTrigger);
      scrollTriggerRef.current = ScrollTrigger;

      const getScrollDistance = () => {
        const container = svgContainerRef.current;
        if (!container) return 0;
        const viewportWidth = window.innerWidth;
        const isMobile = viewportWidth < 768;
        const extraPadding = viewportWidth * (isMobile ? 0.24 : 0.16);
        const scrollDistance = container.scrollWidth - viewportWidth + extraPadding;

        return Math.max(scrollDistance, 0);
      };

      contextRef.current = gsap.context(() => {
        gsap.to(svgContainerRef.current, {
          x: () => -getScrollDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: triggerRef.current,
            start: 'top top',
            end: () => {
              const viewportWidth = window.innerWidth;
              const isMobile = viewportWidth < 768;
              const scrollDistance = getScrollDistance();
              const scrollLength = scrollDistance * (isMobile ? 2.8 : 1);

              return `+=${scrollLength}`;
            },
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setProgress(Math.round(self.progress * 100));
            },
          },
        });
      }, sectionRef);
    };

    setup();

    return () => {
      isMounted = false;
      contextRef.current?.revert();
      contextRef.current = null;
    };
  }, [svgDimensions]);

  useDebouncedResize(
    useCallback(() => {
      if (svgNaturalRef.current) {
        setSvgDimensions(computeSvgDimensions(svgNaturalRef.current.width, svgNaturalRef.current.height));
      }
      scrollTriggerRef.current?.refresh();
    }, [computeSvgDimensions]),
  );

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const startPadding = typeof window !== 'undefined' ? window.innerWidth * (isDesktop ? 0.08 : 0.05) : 100;

  return (
    <section ref={sectionRef} className="relative z-20">
      <div ref={triggerRef} className="h-screen w-full overflow-hidden relative bg-[#fafafa]">
        <div className="absolute inset-0 bg-[#fafafa]" />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="absolute top-12 left-6 md:left-16 z-20 max-w-xl"
          >
            {title && (
              <div className="inline-block mb-4 px-4 py-1.5 border border-gray-300 rounded-full text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] bg-white/90 backdrop-blur-sm">
                {title}
              </div>
            )}
            {subtitle && (
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[0.95]">
                {subtitle}
              </h2>
            )}
          </motion.div>
        )}

        <div
          ref={svgContainerRef}
          className="absolute inset-0 flex items-center"
          style={{
            paddingLeft: startPadding,
            willChange: 'transform',
          }}
        >
          {svgDimensions.width > 0 && (
            <img
              src={svgUrl}
              alt="Architecture Blueprint"
              className="max-w-none select-none"
              style={{
                width: svgDimensions.width,
                height: svgDimensions.height,
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.1))',
              }}
              draggable={false}
            />
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200/80 shadow-lg z-20">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Explore</span>
          <div className="w-32 md:w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-transform duration-100 origin-left"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <span className="text-xs font-mono text-gray-600 w-8 text-right tabular-nums">{progress}%</span>
        </div>
      </div>
    </section>
  );
};
