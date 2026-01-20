import { AnimatePresence, motion } from 'framer-motion';

import { CategoryIcons, categories, categoryConfig } from './constants';
import type { CategoryType } from './types';

interface FilterBarProps {
  activeFilter: CategoryType | 'all';
  onFilterChange: (filter: CategoryType | 'all') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  categoryCounts: Record<CategoryType, number>;
  totalCount: number;
}

export const FilterBar = ({
  activeFilter,
  onFilterChange,
  showFilters,
  onToggleFilters,
  categoryCounts,
  totalCount,
}: FilterBarProps) => {
  return (
    <div className="relative w-full">
      <button
        onClick={onToggleFilters}
        className="w-full h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-black transition-all group"
        aria-label="Toggle location category filters"
      >
        <svg
          className="w-6 h-6 text-black group-hover:text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
      </button>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-0 left-full ml-2 w-64 bg-white border-2 border-black rounded-lg shadow-lg"
          >
            <div className="p-4">
              <h4 className="font-mono text-sm font-bold uppercase mb-3">Categories</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onFilterChange('all')}
                  className={`w-full text-left px-3 py-2 text-xs font-mono font-bold uppercase border-2 transition-all ${
                    activeFilter === 'all'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:border-black'
                  }`}
                >
                  All ({totalCount})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onFilterChange(cat)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-mono font-bold uppercase border-2 transition-all ${
                      activeFilter === cat
                        ? 'text-white border-black'
                        : 'bg-white text-black border-gray-300 hover:border-black'
                    }`}
                    style={{ background: activeFilter === cat ? categoryConfig[cat].color : 'white' }}
                  >
                    <span className="w-4 h-4">{CategoryIcons[cat]}</span>
                    <span>{categoryConfig[cat].label}</span>
                    <span className="ml-auto text-[10px]">({categoryCounts[cat] || 0})</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
