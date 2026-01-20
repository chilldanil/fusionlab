import { motion } from 'framer-motion';

import { CategoryIcons, categoryConfig } from './constants';
import type { Location } from './types';

interface LocationSidebarProps {
  location: Location;
  selectedIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  imageError: Set<number>;
  onImageError: (id: number) => void;
}

export const LocationSidebar = ({
  location,
  selectedIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  imageError,
  onImageError,
}: LocationSidebarProps) => {
  return (
    <motion.aside
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 left-0 w-full md:max-w-md h-full bg-white z-40 md:border-r-2 border-black flex flex-col"
    >
      <div
        className="relative h-[55%] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-b-2 border-black"
        style={{
          background: `linear-gradient(135deg, ${categoryConfig[location.category].color}15, ${
            categoryConfig[location.category].color
          }30)`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 bg-white hover:bg-black border-2 border-black flex items-center justify-center transition-all group z-30"
          aria-label="Close location details"
        >
          <svg
            className="w-5 h-5 text-black group-hover:text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <span className="absolute top-4 left-4 font-mono text-xs bg-white text-black px-3 py-2 border-2 border-black font-bold z-30">
          #{String(selectedIndex + 1).padStart(3, '0')}
        </span>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:16px_16px]" />

        {location.photoUrl && !imageError.has(location.id) ? (
          <img
            src={location.photoUrl}
            alt={location.name}
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={() => onImageError(location.id)}
          />
        ) : null}

        <span
          className="relative w-32 h-32 opacity-15 z-0"
          style={{ color: categoryConfig[location.category].color }}
        >
          {CategoryIcons[location.category]}
        </span>
      </div>

      <div className="flex-1 bg-white px-6 py-5 border-b-2 border-black overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-xs font-mono font-bold uppercase tracking-wider text-white"
            style={{ background: categoryConfig[location.category].color }}
          >
            <span className="w-3 h-3">{CategoryIcons[location.category]}</span>
            {categoryConfig[location.category].label}
          </span>
          {location.rating ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-amber-500 text-xs font-mono font-bold bg-amber-50 text-amber-700">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {location.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <h3 className="text-2xl font-bold tracking-tight text-black mb-2">{location.name}</h3>

        <p className="text-sm text-gray-700 mb-3 flex items-start gap-2 font-mono">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {location.address}
        </p>

        {location.description ? (
          <p className="text-sm text-gray-700 leading-relaxed mb-4 font-light">{location.description}</p>
        ) : null}

        {location.googleMapsLink ? (
          <a
            href={location.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-black text-white text-sm font-mono font-bold uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all group"
          >
            Open in Maps
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        ) : null}
      </div>

      <div className="px-6 py-4 border-t-2 border-black flex items-center justify-between bg-gray-50">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 text-sm font-mono font-bold uppercase text-black hover:bg-black hover:text-white px-3 py-2 border-2 border-black transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>
        <span className="font-mono text-xs text-black font-bold border-2 border-black px-3 py-1">
          {selectedIndex + 1} / {totalCount}
        </span>
        <button
          onClick={onNext}
          className="flex items-center gap-2 text-sm font-mono font-bold uppercase text-black hover:bg-black hover:text-white px-3 py-2 border-2 border-black transition-all"
        >
          Next
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </motion.aside>
  );
};
