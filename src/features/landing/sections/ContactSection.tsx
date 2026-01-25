import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextReveal, MaskReveal } from '../components/awwwards/TextReveal';
import { MagneticButton } from '../components/awwwards/MagneticButton';
import { Send, MapPin, Mail, Phone, ArrowUpRight, Check } from 'lucide-react';

export const ContactSection = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormState({ name: '', email: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <MapPin className="w-5 h-5" />,
      label: 'Location',
      value: 'Munich, Germany',
      link: '#map',
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: 'Email',
      value: 'hello@fusionlab.de',
      link: 'mailto:hello@fusionlab.de',
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: 'Phone',
      value: '+49 89 123 456',
      link: 'tel:+4989123456',
    },
  ];

  return (
    <section id="contact" className="relative py-32 md:py-48 bg-[var(--color-black)] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(37, 99, 235, 0.1) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left - Info */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-6 text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase"
            >
              Get in Touch
            </motion.span>

            <TextReveal
              as="h2"
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8"
              splitBy="words"
              stagger={0.05}
            >
              Let's Create Together
            </TextReveal>

            <TextReveal
              as="p"
              className="text-lg text-white/50 max-w-md mb-12 leading-relaxed"
              splitBy="words"
              stagger={0.01}
              delay={0.3}
            >
              Ready to bring your ideas to life? Get in touch and let's discuss
              how FusionLab can help you create something amazing.
            </TextReveal>

            {/* Contact info */}
            <div className="space-y-6 mb-12">
              {contactInfo.map((item, index) => (
                <MaskReveal key={index} direction="left" delay={index * 0.1}>
                  <a
                    href={item.link}
                    className="flex items-center gap-4 group"
                    data-cursor="link"
                  >
                    <div className="w-12 h-12 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-[var(--color-accent)] group-hover:border-[var(--color-accent)]/30 transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      <p className="text-white group-hover:text-[var(--color-accent)] transition-colors">
                        {item.value}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-[var(--color-accent)] ml-auto transition-colors" />
                  </a>
                </MaskReveal>
              ))}
            </div>

            {/* Social links */}
            <div className="flex gap-4">
              {['Twitter', 'Instagram', 'LinkedIn', 'YouTube'].map((social) => (
                <MagneticButton key={social}>
                  <a
                    href="#"
                    className="px-4 py-2 border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/30 transition-all duration-300"
                    data-cursor="link"
                  >
                    {social}
                  </a>
                </MagneticButton>
              ))}
            </div>
          </div>

          {/* Right - Form */}
          <div>
            <MaskReveal direction="up">
              <form onSubmit={handleSubmit} className="relative">
                {/* Form fields */}
                <div className="space-y-8">
                  {/* Name field */}
                  <div className="relative">
                    <motion.label
                      className="absolute left-0 text-white/30 pointer-events-none transition-all duration-300"
                      animate={{
                        y: focusedField === 'name' || formState.name ? -24 : 0,
                        scale: focusedField === 'name' || formState.name ? 0.8 : 1,
                        color: focusedField === 'name' ? 'rgb(37, 99, 235)' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      Your Name
                    </motion.label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full bg-transparent border-b border-white/10 py-4 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      required
                    />
                  </div>

                  {/* Email field */}
                  <div className="relative">
                    <motion.label
                      className="absolute left-0 text-white/30 pointer-events-none transition-all duration-300"
                      animate={{
                        y: focusedField === 'email' || formState.email ? -24 : 0,
                        scale: focusedField === 'email' || formState.email ? 0.8 : 1,
                        color: focusedField === 'email' ? 'rgb(37, 99, 235)' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      Email Address
                    </motion.label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full bg-transparent border-b border-white/10 py-4 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      required
                    />
                  </div>

                  {/* Message field */}
                  <div className="relative">
                    <motion.label
                      className="absolute left-0 top-0 text-white/30 pointer-events-none transition-all duration-300"
                      animate={{
                        y: focusedField === 'message' || formState.message ? -24 : 0,
                        scale: focusedField === 'message' || formState.message ? 0.8 : 1,
                        color: focusedField === 'message' ? 'rgb(37, 99, 235)' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      Your Message
                    </motion.label>
                    <textarea
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      rows={4}
                      className="w-full bg-transparent border-b border-white/10 py-4 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Submit button */}
                <motion.div className="mt-12">
                  <MagneticButton cursorText="Send">
                    <button
                      type="submit"
                      className="group relative flex items-center gap-4 px-8 py-4 bg-white text-black font-medium overflow-hidden"
                      disabled={isSubmitted}
                    >
                      <AnimatePresence mode="wait">
                        {isSubmitted ? (
                          <motion.span
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            Message Sent
                          </motion.span>
                        ) : (
                          <motion.span
                            key="default"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center gap-2"
                          >
                            Send Message
                            <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Hover fill */}
                      <motion.div
                        className="absolute inset-0 bg-[var(--color-accent)]"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </button>
                  </MagneticButton>
                </motion.div>

                {/* Decorative corner */}
                <div className="absolute -top-4 -right-4 w-8 h-8 border-t border-r border-white/10" />
                <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b border-l border-white/10" />
              </form>
            </MaskReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
