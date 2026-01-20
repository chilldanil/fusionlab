import { motion } from 'framer-motion';

export const MapIntro = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
      className="max-w-4xl mb-12"
    >
      <div className="inline-block mb-6 px-3 py-1 border border-gray-200 rounded-full text-xs font-mono text-gray-500 uppercase tracking-widest">
        City Explorer
      </div>
      <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-8">
        DISCOVER <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">MUNICH</span>
      </h2>
      <p className="text-xl md:text-2xl text-gray-500 max-w-2xl font-light leading-relaxed">
        Explore curated locations across the city. Click any marker to view details, or filter by category to find exactly
        what you're looking for.
      </p>
    </motion.div>
  );
};
