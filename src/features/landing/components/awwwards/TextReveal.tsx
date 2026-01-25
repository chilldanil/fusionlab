import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  splitBy?: 'chars' | 'words' | 'lines';
  stagger?: number;
  duration?: number;
  delay?: number;
  y?: number;
  scrub?: boolean;
  start?: string;
  end?: string;
  once?: boolean;
}

export const TextReveal = ({
  children,
  className = '',
  as: Tag = 'div',
  splitBy = 'words',
  stagger = 0.02,
  duration = 0.8,
  delay = 0,
  y = 100,
  scrub = false,
  start = 'top 90%',
  end = 'top 30%',
  once = true,
}: TextRevealProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Split the text
    const split = new SplitType(containerRef.current, {
      types: splitBy === 'chars' ? 'chars,words' : splitBy === 'words' ? 'words' : 'lines',
      tagName: 'span',
    });

    splitRef.current = split;

    const elements = splitBy === 'chars'
      ? split.chars
      : splitBy === 'words'
        ? split.words
        : split.lines;

    if (!elements) return;

    // Set initial state
    gsap.set(elements, {
      y,
      opacity: 0,
      rotateX: splitBy === 'chars' ? 90 : 0,
    });

    // Create animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start,
        end: scrub ? end : undefined,
        scrub: scrub ? 1 : false,
        once,
        toggleActions: scrub ? undefined : 'play none none none',
      },
    });

    tl.to(elements, {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration,
      stagger,
      delay,
      ease: 'power3.out',
    });

    return () => {
      split.revert();
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === containerRef.current) {
          t.kill();
        }
      });
    };
  }, [children, splitBy, stagger, duration, delay, y, scrub, start, end, once]);

  return (
    <Tag
      ref={containerRef as any}
      className={`text-reveal ${className}`}
      style={{ perspective: '1000px' }}
    >
      {children}
    </Tag>
  );
};

// Mask reveal animation (wipe effect)
interface MaskRevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  start?: string;
  once?: boolean;
}

export const MaskReveal = ({
  children,
  className = '',
  direction = 'up',
  duration = 1,
  delay = 0,
  start = 'top 85%',
  once = true,
}: MaskRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const getClipPath = (progress: number) => {
      switch (direction) {
        case 'up':
          return `polygon(0 ${100 - progress * 100}%, 100% ${100 - progress * 100}%, 100% 100%, 0 100%)`;
        case 'down':
          return `polygon(0 0, 100% 0, 100% ${progress * 100}%, 0 ${progress * 100}%)`;
        case 'left':
          return `polygon(${100 - progress * 100}% 0, 100% 0, 100% 100%, ${100 - progress * 100}% 100%)`;
        case 'right':
          return `polygon(0 0, ${progress * 100}% 0, ${progress * 100}% 100%, 0 100%)`;
        default:
          return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
      }
    };

    gsap.set(containerRef.current, {
      clipPath: getClipPath(0),
    });

    gsap.to(containerRef.current, {
      clipPath: getClipPath(1),
      duration,
      delay,
      ease: 'power3.inOut',
      scrollTrigger: {
        trigger: containerRef.current,
        start,
        once,
        toggleActions: 'play none none none',
      },
    });

    // Parallax content
    gsap.from(contentRef.current, {
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
      duration,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start,
        once,
        toggleActions: 'play none none none',
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === containerRef.current) {
          t.kill();
        }
      });
    };
  }, [direction, duration, delay, start, once]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

// Blur reveal animation
interface BlurRevealProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  start?: string;
  once?: boolean;
}

export const BlurReveal = ({
  children,
  className = '',
  duration = 1,
  delay = 0,
  start = 'top 85%',
  once = true,
}: BlurRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        filter: 'blur(20px)',
        y: 30,
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start,
          once,
          toggleActions: 'play none none none',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === ref.current) {
          t.kill();
        }
      });
    };
  }, [duration, delay, start, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// Counter animation
interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  start?: string;
}

export const Counter = ({
  end,
  duration = 2,
  suffix = '',
  prefix = '',
  className = '',
  start = 'top 85%',
}: CounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const obj = { value: 0 };

    gsap.to(obj, {
      value: end,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start,
        once: true,
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(obj.value)}${suffix}`;
        }
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === ref.current) {
          t.kill();
        }
      });
    };
  }, [end, duration, suffix, prefix, start]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
};
