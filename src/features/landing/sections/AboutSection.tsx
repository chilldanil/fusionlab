import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextReveal, MaskReveal, Counter } from '../components/awwwards/TextReveal';

gsap.registerPlugin(ScrollTrigger);

export const AboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Parallax for background image
  const imageY = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);

  // Horizontal line animation
  useEffect(() => {
    if (!containerRef.current) return;

    const lines = containerRef.current.querySelectorAll('.reveal-line');

    lines.forEach(line => {
      gsap.fromTo(
        line,
        { scaleX: 0, transformOrigin: 'left' },
        {
          scaleX: 1,
          duration: 1.5,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: line,
            start: 'top 80%',
            once: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const stats = [
    { value: 1200, suffix: 'm²', label: 'Workshop Space' },
    { value: 50, suffix: '+', label: 'Tools & Machines' },
    { value: 24, suffix: '/7', label: 'Access Hours' },
    { value: 500, suffix: '+', label: 'Active Members' },
  ];

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative py-32 md:py-48 bg-[var(--color-black)] overflow-hidden"
    >
      {/* Background parallax image */}
      <motion.div
        ref={parallaxRef}
        className="absolute inset-0 z-0"
        style={{ y: imageY }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </motion.div>

      <div className="container-wide relative z-10">
        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-24">
          {/* Left - Title */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-6 text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase"
            >
              About Us
            </motion.span>

            <TextReveal
              as="h2"
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
              splitBy="words"
              stagger={0.05}
            >
              Where Innovation Meets Craftsmanship
            </TextReveal>

            <div className="reveal-line mt-8 h-px bg-white/20" />
          </div>

          {/* Right - Description */}
          <div className="flex flex-col justify-end">
            <TextReveal
              as="p"
              className="text-lg md:text-xl text-white/60 leading-relaxed mb-8"
              splitBy="words"
              stagger={0.01}
              delay={0.3}
            >
              FusionLab is Munich's premier makerspace—a collaborative workshop
              where engineers, artists, and entrepreneurs come together to bring
              their ideas to life.
            </TextReveal>

            <TextReveal
              as="p"
              className="text-lg md:text-xl text-white/40 leading-relaxed"
              splitBy="words"
              stagger={0.01}
              delay={0.5}
            >
              With state-of-the-art equipment, expert mentorship, and a vibrant
              community, we provide everything you need to prototype, iterate,
              and create.
            </TextReveal>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 mb-32">
          {stats.map((stat, index) => (
            <MaskReveal
              key={index}
              direction="up"
              delay={index * 0.1}
              className="group"
            >
              <div className="p-6 md:p-8 border border-white/10 hover:border-white/30 transition-colors duration-500">
                <div className="flex items-baseline gap-1 mb-3">
                  <Counter
                    end={stat.value}
                    suffix={stat.suffix}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-white"
                  />
                </div>
                <p className="text-sm text-white/40 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </MaskReveal>
          ))}
        </div>

        {/* Featured image with parallax */}
        <div className="relative">
          <MaskReveal direction="up" duration={1.2}>
            <div
              ref={imageRef}
              className="relative aspect-[16/9] overflow-hidden"
            >
              {/* Placeholder for actual image */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 border border-white/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <p className="text-white/30 text-sm uppercase tracking-widest">
                      Workshop Space
                    </p>
                  </div>
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/20" />
              <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-white/20" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-white/20" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/20" />
            </div>
          </MaskReveal>

          {/* Floating text overlay */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute -bottom-8 -right-8 hidden lg:block"
          >
            <div className="bg-[var(--color-accent)] px-8 py-6">
              <p className="text-black font-bold text-lg">Est. 2020</p>
              <p className="text-black/60 text-sm">Munich, Germany</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
