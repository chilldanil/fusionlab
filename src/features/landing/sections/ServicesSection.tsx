import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { TextReveal, MaskReveal } from '../components/awwwards/TextReveal';
import { ArrowUpRight, Printer, Cpu, Wrench, Zap, Users, Clock } from 'lucide-react';

interface Service {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const services: Service[] = [
  {
    id: 1,
    icon: <Printer className="w-8 h-8" />,
    title: '3D Printing Lab',
    description: 'Industrial-grade FDM, SLA, and SLS printers for rapid prototyping.',
    features: ['FDM & Resin', 'Large Format', 'Metal Printing'],
  },
  {
    id: 2,
    icon: <Cpu className="w-8 h-8" />,
    title: 'CNC Machining',
    description: 'Precision milling and turning for metal, wood, and composite materials.',
    features: ['3-Axis Mill', '5-Axis Mill', 'Lathe'],
  },
  {
    id: 3,
    icon: <Zap className="w-8 h-8" />,
    title: 'Laser Systems',
    description: 'High-power CO2 and fiber lasers for cutting and engraving.',
    features: ['CO2 Cutter', 'Fiber Laser', 'Engraving'],
  },
  {
    id: 4,
    icon: <Wrench className="w-8 h-8" />,
    title: 'Electronics Lab',
    description: 'Complete electronics workstations with oscilloscopes and soldering.',
    features: ['PCB Fab', 'SMD Station', 'Testing'],
  },
  {
    id: 5,
    icon: <Users className="w-8 h-8" />,
    title: 'Coworking',
    description: 'Flexible workspace for teams and individuals with all amenities.',
    features: ['Hot Desks', 'Private Office', 'Meeting Rooms'],
  },
  {
    id: 6,
    icon: <Clock className="w-8 h-8" />,
    title: '24/7 Access',
    description: 'Round-the-clock access for members with secure entry system.',
    features: ['Key Card', 'CCTV', 'Support'],
  },
];

// 3D Card component with tilt effect
const ServiceCard = ({ service, index }: { service: Service; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <MaskReveal direction="up" delay={index * 0.1}>
      <motion.div
        ref={cardRef}
        className="relative h-full perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          className="relative h-full p-8 bg-white/[0.02] border border-white/10 overflow-hidden group"
          data-cursor="view"
          data-cursor-text="View"
          animate={{
            borderColor: isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 50%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              className="w-16 h-16 mb-6 flex items-center justify-center border border-white/10 text-white/60 group-hover:text-[var(--color-accent)] group-hover:border-[var(--color-accent)]/30 transition-all duration-500"
              style={{ transform: 'translateZ(30px)' }}
            >
              {service.icon}
            </motion.div>

            {/* Title */}
            <h3
              className="text-2xl font-bold text-white mb-4 group-hover:text-[var(--color-accent)] transition-colors duration-300"
              style={{ transform: 'translateZ(20px)' }}
            >
              {service.title}
            </h3>

            {/* Description */}
            <p
              className="text-white/40 mb-6 leading-relaxed"
              style={{ transform: 'translateZ(15px)' }}
            >
              {service.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-8" style={{ transform: 'translateZ(10px)' }}>
              {service.features.map((feature, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs font-mono text-white/30 border border-white/10 uppercase tracking-wider"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Link */}
            <motion.div
              className="flex items-center gap-2 text-sm text-white/30 group-hover:text-white transition-colors"
              style={{ transform: 'translateZ(25px)' }}
            >
              <span className="font-medium">Learn more</span>
              <motion.div
                animate={{ x: isHovered ? 5 : 0, y: isHovered ? -5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight className="w-4 h-4" />
              </motion.div>
            </motion.div>
          </div>

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-full h-full border-t border-r border-white/10 group-hover:border-[var(--color-accent)]/30 transition-colors duration-500" />
          </div>

          {/* Number */}
          <div className="absolute bottom-4 right-4 text-6xl font-bold text-white/[0.02] group-hover:text-white/[0.05] transition-colors duration-500">
            {String(service.id).padStart(2, '0')}
          </div>
        </motion.div>
      </motion.div>
    </MaskReveal>
  );
};

export const ServicesSection = () => {
  return (
    <section className="relative py-32 md:py-48 bg-[var(--color-black)] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container-wide relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-6 text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase"
            >
              What We Offer
            </motion.span>

            <TextReveal
              as="h2"
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
              splitBy="words"
              stagger={0.05}
            >
              Equipment & Services
            </TextReveal>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/40 max-w-md"
          >
            Professional-grade tools and spaces for every stage of your project.
          </motion.p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-white/30 mb-6">
            Can't find what you're looking for?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-white transition-colors"
            data-cursor="link"
          >
            <span className="font-medium">Contact us for custom solutions</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
