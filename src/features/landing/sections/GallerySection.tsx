import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GalleryItem {
  id: number;
  title: string;
  category: string;
  color: string;
}

const galleryItems: GalleryItem[] = [
  { id: 1, title: '3D Printing Lab', category: 'Manufacturing', color: '#3b82f6' },
  { id: 2, title: 'CNC Workshop', category: 'Machining', color: '#8b5cf6' },
  { id: 3, title: 'Electronics Station', category: 'Assembly', color: '#ec4899' },
  { id: 4, title: 'Laser Cutting', category: 'Fabrication', color: '#22c55e' },
  { id: 5, title: 'Woodworking', category: 'Craft', color: '#f59e0b' },
  { id: 6, title: 'Meeting Spaces', category: 'Collaboration', color: '#06b6d4' },
];

export const GallerySection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const totalWidth = container.scrollWidth;
    const viewportWidth = window.innerWidth;

    // Horizontal scroll animation
    gsap.to(container, {
      x: -(totalWidth - viewportWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: `+=${totalWidth}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen bg-[var(--color-black)] overflow-hidden"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Header - fixed position */}
      <div className="absolute top-12 left-0 right-0 z-20 container-wide">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase">
              Gallery
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
              Our Spaces
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-4 text-white/30">
            <span className="text-sm font-mono">Scroll to explore</span>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.div>
          </div>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={containerRef}
        className="absolute top-0 left-0 h-full flex items-center gap-8 pl-8 pr-[50vw]"
        style={{ paddingTop: '100px' }}
      >
        {galleryItems.map((item, index) => (
          <motion.div
            key={item.id}
            className="relative flex-shrink-0 w-[70vw] md:w-[50vw] lg:w-[40vw] h-[60vh] group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            data-cursor="view"
            data-cursor-text="View"
          >
            {/* Card */}
            <motion.div
              className="relative w-full h-full overflow-hidden"
              animate={{
                scale: hoveredIndex === index ? 1.02 : 1,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Background */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${item.color}20 0%, transparent 50%)`,
                }}
              />

              {/* Border */}
              <div className="absolute inset-0 border border-white/10 group-hover:border-white/30 transition-colors duration-500" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-between p-8">
                {/* Top - Number */}
                <div className="flex items-start justify-between">
                  <span
                    className="text-8xl md:text-9xl font-bold opacity-10"
                    style={{ color: item.color }}
                  >
                    {String(item.id).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>

                {/* Center - Icon placeholder */}
                <div className="flex items-center justify-center">
                  <motion.div
                    className="w-24 h-24 border border-white/10 flex items-center justify-center"
                    animate={{
                      borderColor: hoveredIndex === index ? `${item.color}50` : 'rgba(255,255,255,0.1)',
                      rotate: hoveredIndex === index ? 45 : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="w-12 h-12 border border-white/20"
                      animate={{
                        rotate: hoveredIndex === index ? -45 : 0,
                        scale: hoveredIndex === index ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.5 }}
                      style={{ backgroundColor: `${item.color}30` }}
                    />
                  </motion.div>
                </div>

                {/* Bottom - Title */}
                <div>
                  <motion.h3
                    className="text-3xl md:text-4xl font-bold text-white mb-2"
                    animate={{
                      x: hoveredIndex === index ? 10 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.title}
                  </motion.h3>
                  <motion.div
                    className="h-px w-0 group-hover:w-full transition-all duration-500"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>

              {/* Hover gradient */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(to top, ${item.color}20 0%, transparent 50%)`,
                }}
              />
            </motion.div>
          </motion.div>
        ))}

        {/* End card */}
        <div className="flex-shrink-0 w-[40vw] h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <motion.p
              className="text-white/30 text-lg mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Ready to start creating?
            </motion.p>
            <motion.a
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              data-cursor="link"
            >
              Book a Tour
            </motion.a>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-8 right-8 h-px bg-white/10">
        <motion.div
          className="h-full bg-white/50"
          style={{
            width: '0%',
            // This would be animated by scroll progress
          }}
        />
      </div>
    </section>
  );
};
