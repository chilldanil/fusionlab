import { motion } from 'framer-motion';

import { CategoryIcons, categoryConfig } from './constants';
import type { Location, CategoryType } from './types';

interface LocationListProps {
  activeFilter: CategoryType | 'all';
  filteredLocations: Location[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSelectLocation: (location: Location) => void;
}

export const LocationList = ({
  activeFilter,
  filteredLocations,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onSelectLocation,
}: LocationListProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-3xl max-h-96 bg-white border-2 border-black overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-white">
        <h3 className="font-mono font-bold text-black uppercase tracking-wider">
          {activeFilter === 'all' ? 'All Locations' : categoryConfig[activeFilter].label}
        </h3>
        <span className="font-mono text-xs text-black font-bold uppercase tracking-wider bg-gray-100 border border-black px-3 py-1">
          {filteredLocations.length}
        </span>
      </div>

      <div className="px-6 py-3 border-b-2 border-black bg-gray-50">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm font-mono bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-gray-300"
          />
          {searchQuery ? (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-black hover:bg-gray-200 border border-black"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto bg-white">
        {filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <svg className="w-16 h-16 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-sm font-mono font-bold text-black uppercase tracking-wider mb-1">No Results</p>
            <p className="text-xs font-mono text-gray-500">Try different filters</p>
          </div>
        ) : (
          filteredLocations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors border-b-2 border-gray-200 last:border-b-0 group"
            >
              <span
                className="w-6 h-6 flex-shrink-0 p-1 border-2 border-black"
                style={{
                  color: categoryConfig[loc.category].color,
                  background: `${categoryConfig[loc.category].color}20`,
                }}
              >
                {CategoryIcons[loc.category]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-black truncate">{loc.name}</div>
                <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  {categoryConfig[loc.category].label}
                  {loc.rating ? (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {loc.rating}
                    </span>
                  ) : null}
                </div>
              </div>
              <svg
                className="w-5 h-5 text-black group-hover:translate-x-1 transition-all"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
