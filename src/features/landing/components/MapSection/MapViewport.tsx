import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import type { Map } from 'mapbox-gl';

import { FilterBar } from './FilterBar';
import { LocationList } from './LocationList';
import { LocationSidebar } from './LocationSidebar';
import { MapControls } from './MapControls';
import type { CategoryType, Location } from './types';

interface MapViewportProps {
  mapContainerRef: RefObject<HTMLDivElement | null>;
  activeFilter: CategoryType | 'all';
  onFilterChange: (filter: CategoryType | 'all') => void;
  filteredLocations: Location[];
  locations: Location[];
  showFilters: boolean;
  onToggleFilters: () => void;
  categoryCounts: Record<CategoryType, number>;
  showLoading: boolean;
  errorTitle?: string;
  errorMessage?: string;
  selectedLocation: Location | null;
  selectedIndex: number;
  showList: boolean;
  isLoaded: boolean;
  imageError: Set<number>;
  onImageError: (id: number) => void;
  onCloseSidebar: () => void;
  onPrevLocation: () => void;
  onNextLocation: () => void;
  onSelectLocation: (location: Location) => void;
  onShowList: (value: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onResetView: () => void;
  map: Map | null;
}

export const MapViewport = ({
  mapContainerRef,
  activeFilter,
  onFilterChange,
  filteredLocations,
  locations,
  showFilters,
  onToggleFilters,
  categoryCounts,
  showLoading,
  errorTitle,
  errorMessage,
  selectedLocation,
  selectedIndex,
  showList,
  isLoaded,
  imageError,
  onImageError,
  onCloseSidebar,
  onPrevLocation,
  onNextLocation,
  onSelectLocation,
  onShowList,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onResetView,
  map,
}: MapViewportProps) => {
  return (
    <div className="relative w-full h-[75vh] border border-gray-200 bg-white overflow-hidden">
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-black z-20 pointer-events-none" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-black z-20 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-black z-20 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-black z-20 pointer-events-none" />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 text-center px-4 w-full max-w-[calc(100%-2rem)]">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
            categoryCounts={categoryCounts}
            totalCount={locations.length}
          />
        </motion.div>
      </div>

      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
        role="region"
        aria-label="Interactive map of Munich locations"
      />

      {errorTitle ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">{errorTitle}</h3>
            {errorMessage ? <p className="text-gray-600 mb-4">{errorMessage}</p> : null}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border-2 border-black font-mono text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      ) : showLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-black border-t-transparent animate-spin" />
            <span className="font-mono text-xs text-black uppercase tracking-widest font-bold">Loading...</span>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {selectedLocation ? (
          <LocationSidebar
            location={selectedLocation}
            selectedIndex={selectedIndex}
            totalCount={locations.length}
            onClose={onCloseSidebar}
            onPrev={onPrevLocation}
            onNext={onNextLocation}
            imageError={imageError}
            onImageError={onImageError}
          />
        ) : null}
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-3 bg-white border-2 border-black p-1"
        >
          <button
            onClick={() => {
              onShowList(false);
              onClearSearch();
            }}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              !showList ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Map
          </button>
          <button
            onClick={() => onShowList(true)}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              showList ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List ({filteredLocations.length})
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showList ? (
          <LocationList
            activeFilter={activeFilter}
            filteredLocations={filteredLocations}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
            onSelectLocation={onSelectLocation}
          />
        ) : null}
      </AnimatePresence>

      <MapControls map={map} onReset={onResetView} />

      <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 z-30 flex flex-col items-end gap-2">
        <span className="font-mono text-[10px] md:text-xs text-black font-bold bg-white border-2 border-black px-2 py-1">
          {filteredLocations.length} / {locations.length}
        </span>
        <div className="w-24 md:w-32 h-2 bg-white border-2 border-black overflow-hidden">
          <motion.div
            className="h-full bg-black"
            initial={{ width: '0%' }}
            animate={{ width: `${(filteredLocations.length / Math.max(locations.length, 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <style>{`
        .mapboxgl-ctrl-attrib,
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
