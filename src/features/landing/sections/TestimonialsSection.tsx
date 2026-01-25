import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { TextReveal } from '../components/awwwards/TextReveal';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Product Designer',
    company: 'TechVentures',
    content: 'FusionLab transformed how we prototype. What used to take weeks now takes days.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Marcus Weber',
    role: 'Mechanical Engineer',
    company: 'AutoInnovate',
    content: 'The CNC equipment here rivals any professional machine shop. Exceptional quality.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Elena Kowalski',
    role: 'Startup Founder',
    company: 'GreenTech Solutions',
    content: 'Not just tools—a community of makers who inspire and support each other.',
    rating: 5,
  },
  {
    id: 4,
    name: 'James Liu',
    role: 'Industrial Designer',
    company: 'DesignWorks',
    content: 'The 24/7 access is game-changing. I can work on my timeline, not someone elses.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Anna Schmidt',
    role: 'Artist',
    company: 'Independent',
    content: 'Found my creative home here. The laser cutter opened entirely new possibilities.',
    rating: 5,
  },
  {
    id: 6,
    name: 'David Park',
    role: 'Electronics Engineer',
    company: 'IoT Systems',
    content: 'Professional electronics lab at a fraction of the cost. Smart investment.',
    rating: 5,
  },
];

// Marquee component
const Marquee = ({
  children,
  direction = 'left',
  speed = 30,
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const content = contentRef.current;
    const contentWidth = content.offsetWidth;

    // Clone content for seamless loop
    const clone = content.cloneNode(true) as HTMLDivElement;
    containerRef.current.appendChild(clone);

    // Animate
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      containerRef.current.children,
      { x: direction === 'left' ? 0 : -contentWidth },
      {
        x: direction === 'left' ? -contentWidth : 0,
        duration: speed,
        ease: 'none',
      }
    );

    return () => {
      tl.kill();
    };
  }, [direction, speed]);

  return (
    <div className="overflow-hidden">
      <div ref={containerRef} className="flex">
        <div ref={contentRef} className="flex shrink-0">
          {children}
        </div>
      </div>
    </div>
  );
};

// Testimonial card
const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div
    className="relative w-[400px] md:w-[500px] p-8 mx-4 bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors duration-300 group"
    data-cursor="drag"
  >
    {/* Quote icon */}
    <div className="absolute top-6 right-6 text-white/5">
      <Quote className="w-12 h-12" />
    </div>

    {/* Rating */}
    <div className="flex gap-1 mb-6">
      {Array.from({ length: testimonial.rating }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
      ))}
    </div>

    {/* Content */}
    <p className="text-lg text-white/70 leading-relaxed mb-8 min-h-[80px]">
      "{testimonial.content}"
    </p>

    {/* Author */}
    <div className="flex items-center gap-4">
      {/* Avatar placeholder */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
        <span className="text-lg font-bold text-white/50">
          {testimonial.name.charAt(0)}
        </span>
      </div>

      <div>
        <p className="font-medium text-white">{testimonial.name}</p>
        <p className="text-sm text-white/40">
          {testimonial.role} at {testimonial.company}
        </p>
      </div>
    </div>

    {/* Hover line */}
    <div className="absolute bottom-0 left-0 w-0 h-px bg-[var(--color-accent)] group-hover:w-full transition-all duration-500" />
  </div>
);

// Large text marquee
const TextMarquee = () => {
  const words = ['INNOVATE', '•', 'CREATE', '•', 'BUILD', '•', 'DESIGN', '•', 'MAKE', '•'];

  return (
    <div className="py-12 border-y border-white/5 overflow-hidden">
      <Marquee speed={40}>
        <div className="flex items-center gap-12 px-6">
          {words.map((word, i) => (
            <span
              key={i}
              className={`text-6xl md:text-8xl font-bold ${
                word === '•' ? 'text-[var(--color-accent)]' : 'text-white/5'
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      </Marquee>
    </div>
  );
};

export const TestimonialsSection = () => {
  return (
    <section className="relative py-32 bg-[var(--color-black)] overflow-hidden">
      {/* Header */}
      <div className="container-wide mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-6 text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase"
            >
              Testimonials
            </motion.span>

            <TextReveal
              as="h2"
              className="text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight"
              splitBy="words"
              stagger={0.05}
            >
              What Makers Say
            </TextReveal>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/40 max-w-md"
          >
            Join hundreds of creators who've made FusionLab their creative home.
          </motion.p>
        </div>
      </div>

      {/* Testimonials marquee - Row 1 */}
      <div className="mb-8">
        <Marquee direction="left" speed={50}>
          <div className="flex">
            {testimonials.slice(0, 3).map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </Marquee>
      </div>

      {/* Testimonials marquee - Row 2 */}
      <div className="mb-16">
        <Marquee direction="right" speed={45}>
          <div className="flex">
            {testimonials.slice(3).map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </Marquee>
      </div>

      {/* Text marquee */}
      <TextMarquee />

      {/* Stats */}
      <div className="container-wide mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '4.9', label: 'Average Rating' },
            { value: '500+', label: 'Happy Members' },
            { value: '98%', label: 'Would Recommend' },
            { value: '5000+', label: 'Projects Completed' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
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
