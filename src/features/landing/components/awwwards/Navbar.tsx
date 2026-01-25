import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MagneticButton } from './MagneticButton';
import { useSmoothScroll } from './SmoothScroll';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

export const AwwwardsNavbar = () => {
  const navigate = useNavigate();
  const { scrollTo } = useSmoothScroll();
  const { scrollY } = useScroll();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Track scroll direction for hide/show
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);

    // Hide on scroll down, show on scroll up
    if (latest > lastScrollY && latest > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    setLastScrollY(latest);
  });

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    if (href.startsWith('#')) {
      scrollTo(href, { offset: -100 });
    } else {
      navigate(href);
    }
  };

  return (
    <>
      {/* Main navbar */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: 0 }}
        animate={{
          y: isVisible ? 0 : -100,
          backgroundColor: isScrolled ? 'rgba(10, 10, 10, 0.9)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="container-wide">
          <nav className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <MagneticButton>
              <a
                href="/"
                className="text-xl md:text-2xl font-bold text-white tracking-tight"
                data-cursor="link"
              >
                FUSIONLAB
              </a>
            </MagneticButton>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <MagneticButton key={link.label}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="relative text-sm text-white/60 hover:text-white transition-colors py-2 group"
                    data-cursor="link"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--color-accent)] group-hover:w-full transition-all duration-300" />
                  </button>
                </MagneticButton>
              ))}

              <div className="w-px h-6 bg-white/10 mx-4" />

              <MagneticButton cursorText="Enter">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 border border-white/20 text-white text-sm hover:bg-white hover:text-black transition-all duration-300"
                  data-cursor="button"
                >
                  Portal Access
                </button>
              </MagneticButton>
            </div>

            {/* Mobile menu button */}
            <MagneticButton>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden w-12 h-12 flex items-center justify-center text-white"
                data-cursor="button"
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </MagneticButton>
          </nav>
        </div>

        {/* Border bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          animate={{
            background: isScrolled
              ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)'
              : 'transparent',
          }}
        />
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu content */}
            <motion.nav
              className="relative h-full flex flex-col justify-center px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ul className="space-y-6">
                {navLinks.map((link, index) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => handleNavClick(link.href)}
                      className="text-4xl md:text-6xl font-bold text-white hover:text-[var(--color-accent)] transition-colors"
                    >
                      {link.label}
                    </button>
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/login');
                  }}
                  className="px-8 py-4 bg-white text-black font-medium"
                >
                  Portal Access
                </button>
              </motion.div>

              {/* Footer info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-12 left-8 right-8"
              >
                <div className="flex justify-between text-sm text-white/30">
                  <span>Munich, Germany</span>
                  <span>hello@fusionlab.de</span>
                </div>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
