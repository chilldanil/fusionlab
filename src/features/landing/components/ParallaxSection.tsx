import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ParallaxSectionProps {
    children: ReactNode;
    zIndex?: number;
    className?: string;
}

export const ParallaxSection = ({ children, zIndex = 20, className = '' }: ParallaxSectionProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        // Create the parallax overlap effect
        const ctx = gsap.context(() => {
            // Animate scale and position as section enters viewport
            gsap.fromTo(
                section,
                {
                    scale: 0.95,
                    borderRadius: '24px 24px 0 0',
                },
                {
                    scale: 1,
                    borderRadius: '0px 0px 0 0',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top bottom', // When top of section hits bottom of viewport
                        end: 'top top', // When top of section hits top of viewport
                        scrub: 1,
                        // markers: true, // Uncomment for debugging
                    },
                }
            );
        }, section);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={sectionRef}
            className={`relative ${className}`}
            style={{
                zIndex,
                transformOrigin: 'center top',
                willChange: 'transform',
            }}
        >
            {children}
        </div>
    );
};
