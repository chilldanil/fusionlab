/**
 * Film Grain for Light Theme
 * Very subtle grain overlay that adds texture without being distracting
 */

// CSS-based grain - very light for white backgrounds
export const CSSGrainLight = () => {
  // Check for reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return null;

  return (
    <div className="grain-light" />
  );
};
