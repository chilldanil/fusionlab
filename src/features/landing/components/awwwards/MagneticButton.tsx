import { useRef, useState } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
  onClick?: () => void;
  cursorText?: string;
}

export const MagneticButton = ({
  children,
  className = '',
  strength = 0.3,
  radius = 100,
  onClick,
  cursorText,
}: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Spring physics
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  // Transform for inner content (more movement)
  const innerX = useTransform(x, (value) => value * 1.5);
  const innerY = useTransform(y, (value) => value * 1.5);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    if (distance < radius) {
      x.set(distanceX * strength);
      y.set(distanceY * strength);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      className={`magnetic-wrap ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      data-cursor="button"
      data-cursor-text={cursorText}
      style={{ x, y }}
    >
      <motion.div
        className="magnetic-content"
        style={{ x: innerX, y: innerY }}
        animate={{
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Primary button variant
interface AwwwardsButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  cursorText?: string;
}

export const AwwwardsButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  cursorText,
}: AwwwardsButtonProps) => {
  const baseStyles = `
    relative overflow-hidden font-medium tracking-wide uppercase
    transition-colors duration-300
  `;

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const variantStyles = {
    primary: `
      bg-white text-black
      hover:bg-gray-100
    `,
    secondary: `
      bg-[var(--color-accent)] text-white
      hover:bg-[var(--color-accent-dark)]
    `,
    outline: `
      bg-transparent text-white border border-white/30
      hover:bg-white/10 hover:border-white/50
    `,
    ghost: `
      bg-transparent text-white
      hover:bg-white/5
    `,
  };

  return (
    <MagneticButton onClick={onClick} cursorText={cursorText}>
      <button
        className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${className}
        `}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>

        {/* Hover fill animation */}
        <motion.div
          className="absolute inset-0 bg-[var(--color-accent)]"
          initial={{ y: '100%' }}
          whileHover={{ y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </button>
    </MagneticButton>
  );
};
