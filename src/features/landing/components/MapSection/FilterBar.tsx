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
    <div className="flex flex-col items-center">
      <div className="md:hidden w-full">
        <button
          onClick={onToggleFilters}
          className="w-full px-4 py-3 bg-white border-2 border-black font-mono font-bold text-xs uppercase flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            {activeFilter === 'all' ? (
              <>ALL ({totalCount})</>
            ) : (
              <>
                <span className="w-4 h-4">{CategoryIcons[activeFilter]}</span>
                {categoryConfig[activeFilter].label} ({categoryCounts[activeFilter] || 0})
              </>
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white border-2 border-t-0 border-black"
            >
              <div className="p-2 grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
                <button
                  onClick={() => {
                    onFilterChange('all');
                    onToggleFilters();
                  }}
                  className={`px-3 py-2 text-xs font-mono font-bold uppercase border-2 transition-all ${
                    activeFilter === 'all'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300'
                  }`}
                >
                  All
                  <br />({totalCount})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onFilterChange(cat);
                      onToggleFilters();
                    }}
                    className={`flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-mono font-bold uppercase border-2 transition-all ${
                      activeFilter === cat ? 'text-white border-black' : 'bg-white text-black border-gray-300'
                    }`}
                    style={{ background: activeFilter === cat ? categoryConfig[cat].color : 'white' }}
                  >
                    <span className="w-5 h-5">{CategoryIcons[cat]}</span>
                    <span className="text-center leading-tight">({categoryCounts[cat] || 0})</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden md:flex flex-wrap items-center justify-center gap-2 bg-white border-2 border-black p-2 max-w-full">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all ${
              activeFilter === cat
                ? 'text-white border-black'
                : 'bg-white text-black border-gray-300 hover:border-black'
            }`}
            style={{ background: activeFilter === cat ? categoryConfig[cat].color : 'white' }}
          >
            <span className="w-3.5 h-3.5">{CategoryIcons[cat]}</span>
            <span>{categoryConfig[cat].label}</span>
            <span className="text-[10px]">({categoryCounts[cat] || 0})</span>
          </button>
        ))}
      </div>
    </div>
  );
};
