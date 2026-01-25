import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextReveal, MaskReveal } from '../components/awwwards/TextReveal';
import { MagneticButton } from '../components/awwwards/MagneticButton';
import { Linkedin, Twitter, Mail } from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  social: {
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

const team: TeamMember[] = [
  {
    id: 1,
    name: 'Dr. Michael Braun',
    role: 'Founder & CEO',
    bio: 'Former BMW engineer with 15+ years in automotive innovation. Passionate about democratizing manufacturing.',
    social: { linkedin: '#', twitter: '#', email: '#' },
  },
  {
    id: 2,
    name: 'Lisa Hoffmann',
    role: 'Head of Operations',
    bio: 'Operations expert who ensures everything runs smoothly. Background in aerospace manufacturing.',
    social: { linkedin: '#', email: '#' },
  },
  {
    id: 3,
    name: 'Thomas Müller',
    role: 'Technical Director',
    bio: 'Mechanical engineer and maker at heart. Oversees all equipment and technical training programs.',
    social: { linkedin: '#', twitter: '#' },
  },
  {
    id: 4,
    name: 'Sarah Kim',
    role: 'Community Manager',
    bio: 'Brings people together. Organizes events, workshops, and builds the FusionLab community.',
    social: { twitter: '#', email: '#' },
  },
];

// Team card with image distortion effect on hover
const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <MaskReveal direction="up" delay={index * 0.15}>
      <motion.div
        ref={cardRef}
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-cursor="view"
        data-cursor-text="View"
      >
        {/* Card */}
        <div className="relative overflow-hidden">
          {/* Image placeholder with gradient */}
          <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
            {/* Abstract avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="relative w-32 h-32"
                animate={{
                  rotate: isHovered ? 45 : 0,
                  scale: isHovered ? 1.2 : 1,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Outer ring */}
                <div className="absolute inset-0 border-2 border-white/10 rounded-full" />

                {/* Inner shape */}
                <motion.div
                  className="absolute inset-4 bg-gradient-to-br from-[var(--color-accent)]/30 to-purple-500/30 rounded-full"
                  animate={{
                    scale: isHovered ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />

                {/* Center initial */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white/80">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Hover overlay */}
            <motion.div
              className="absolute inset-0 bg-[var(--color-accent)]/90 flex items-center justify-center p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white text-center text-sm leading-relaxed">
                {member.bio}
              </p>
            </motion.div>

            {/* Distortion lines effect */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute left-0 right-0 h-px bg-white/20"
                      style={{ top: `${10 + i * 10}%` }}
                      initial={{ scaleX: 0, originX: Math.random() > 0.5 ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Number */}
            <div className="absolute top-4 left-4 text-xs font-mono text-white/30">
              {String(member.id).padStart(2, '0')}
            </div>
          </div>

          {/* Info */}
          <div className="pt-6">
            <motion.h3
              className="text-xl font-bold text-white mb-1"
              animate={{
                x: isHovered ? 10 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {member.name}
            </motion.h3>
            <p className="text-sm text-[var(--color-accent)] mb-4">{member.role}</p>

            {/* Social links */}
            <div className="flex gap-3">
              {member.social.linkedin && (
                <MagneticButton>
                  <a
                    href={member.social.linkedin}
                    className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                    data-cursor="link"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </MagneticButton>
              )}
              {member.social.twitter && (
                <MagneticButton>
                  <a
                    href={member.social.twitter}
                    className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                    data-cursor="link"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                </MagneticButton>
              )}
              {member.social.email && (
                <MagneticButton>
                  <a
                    href={`mailto:${member.social.email}`}
                    className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                    data-cursor="link"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </MagneticButton>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </MaskReveal>
  );
};

export const TeamSection = () => {
  return (
    <section className="relative py-32 md:py-48 bg-[var(--color-black)] overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

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
              The Team
            </motion.span>

            <TextReveal
              as="h2"
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
              splitBy="words"
              stagger={0.05}
            >
              Meet the Makers Behind FusionLab
            </TextReveal>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/40 max-w-md"
          >
            A diverse team of engineers, designers, and makers passionate about helping you create.
          </motion.p>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <TeamCard key={member.id} member={member} index={index} />
          ))}
        </div>

        {/* Join CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-8 border border-white/10">
            <p className="text-white/50 mb-4">Want to join our team?</p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-white transition-colors"
              data-cursor="link"
            >
              <span className="font-medium">View open positions</span>
              <span>→</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
