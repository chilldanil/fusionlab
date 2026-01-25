import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MagneticButton } from '../components/awwwards/MagneticButton';
import { ArrowUp } from 'lucide-react';
import { useSmoothScroll } from '../components/awwwards/SmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export const FooterSection = () => {
  const footerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    if (!footerRef.current || !textRef.current) return;

    // Parallax effect on large text
    gsap.fromTo(
      textRef.current,
      { y: 100 },
      {
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top bottom',
          end: 'top top',
          scrub: 1,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handleScrollTop = () => {
    scrollTo(0, { duration: 2 });
  };

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Services: ['3D Printing', 'CNC Machining', 'Laser Cutting', 'Electronics', 'Coworking'],
    Company: ['About Us', 'Team', 'Careers', 'Press', 'Contact'],
    Resources: ['Blog', 'Tutorials', 'FAQ', 'Support', 'Community'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Imprint'],
  };

  return (
    <footer ref={footerRef} className="relative bg-[var(--color-black)] overflow-hidden">
      {/* Large background text */}
      <div
        ref={textRef}
        className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none select-none"
      >
        <div className="text-[20vw] font-bold text-white/[0.02] leading-none tracking-tighter whitespace-nowrap">
          FUSIONLAB
        </div>
      </div>

      {/* Main footer content */}
      <div className="relative z-10 container-wide pt-24 pb-12">
        {/* Top section - CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pb-16 border-b border-white/10">
          <div>
            <h3 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to start making?
            </h3>
            <p className="text-lg text-white/40">
              Join Munich's premier makerspace today.
            </p>
          </div>

          <MagneticButton cursorText="Join">
            <a
              href="#contact"
              className="inline-flex items-center gap-4 px-8 py-4 bg-white text-black font-medium hover:bg-[var(--color-accent)] hover:text-white transition-colors duration-300"
            >
              Become a Member
            </a>
          </MagneticButton>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-white/10">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-6">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/50 hover:text-white transition-colors duration-200 relative group"
                      data-cursor="link"
                    >
                      {link}
                      <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--color-accent)] group-hover:w-full transition-all duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pt-12">
          {/* Logo & copyright */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-2xl font-bold text-white" data-cursor="link">
              FUSIONLAB
            </a>
            <span className="text-sm text-white/30">
              © {currentYear} All rights reserved.
            </span>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-6">
            {['Tw', 'In', 'Li', 'Yt'].map((social) => (
              <MagneticButton key={social}>
                <a
                  href="#"
                  className="w-10 h-10 border border-white/10 flex items-center justify-center text-sm text-white/50 hover:text-white hover:border-white/30 transition-all duration-300"
                  data-cursor="link"
                >
                  {social}
                </a>
              </MagneticButton>
            ))}
          </div>

          {/* Back to top */}
          <MagneticButton onClick={handleScrollTop} cursorText="Top">
            <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
              <span className="text-sm">Back to top</span>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowUp className="w-4 h-4" />
              </motion.div>
            </button>
          </MagneticButton>
        </div>

        {/* Made with love */}
        <div className="mt-16 text-center">
          <p className="text-xs text-white/20">
            Crafted with precision in Munich, Germany
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </footer>
  );
};
