import { useCallback, useMemo, useRef, useState } from 'react';
import { MapIntro } from './MapIntro';
import { MapViewport } from './MapViewport';
import 'mapbox-gl/dist/mapbox-gl.css';
import { categoryConfig } from './constants';
import { useMapbox } from './hooks/useMapbox';
import { useLocations } from './hooks/useLocations';
import { useMapClusters } from './hooks/useMapClusters';
import type { CategoryType, Location } from './types';
import { MAP_CONFIG } from '../../constants/map';
import { useDebouncedResize } from '../../../../shared/hooks/useDebouncedResize';

export const MapSection = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showList, setShowList] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryType | 'all'>('all');
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { locations, isLoading, error } = useLocations();

  const handleClearSelection = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  const { map, isLoaded, error: mapError } = useMapbox({
    containerRef: mapContainer,
    onEmptyClick: handleClearSelection,
  });
  const locationIndexById = useMemo(() => {
    return new Map(locations.map((loc, index) => [loc.id, index]));
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const byCategory = activeFilter === 'all' ? locations : locations.filter((loc) => loc.category === activeFilter);
    if (!searchQuery.trim()) return byCategory;

    const query = searchQuery.toLowerCase();
    return byCategory.filter((loc) =>
      loc.name.toLowerCase().includes(query) ||
      loc.address.toLowerCase().includes(query) ||
      loc.description.toLowerCase().includes(query) ||
      categoryConfig[loc.category].label.toLowerCase().includes(query),
    );
  }, [activeFilter, locations, searchQuery]);

  const categoryCounts = useMemo(() => {
    return locations.reduce((acc, loc) => {
      acc[loc.category] = (acc[loc.category] || 0) + 1;
      return acc;
    }, {} as Record<CategoryType, number>);
  }, [locations]);

  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: filteredLocations.map((loc) => ({
        type: 'Feature' as const,
        properties: {
          id: loc.id,
          index: locationIndexById.get(loc.id) ?? 0,
          name: loc.name,
          category: loc.category,
          color: categoryConfig[loc.category].color,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: loc.coordinates,
        },
      })),
    };
  }, [filteredLocations, locationIndexById]);

  const selectLocation = useCallback(
    (location: Location) => {
      const index = locationIndexById.get(location.id) ?? 0;
      setSelectedLocation(location);
      setSelectedIndex(index);
      setShowList(false);
      setSearchQuery('');

      map?.flyTo({
        center: location.coordinates,
        zoom: MAP_CONFIG.mapbox.detailZoom,
        duration: 800,
        essential: true,
      });
    },
    [locationIndexById, map],
  );

  const selectLocationByIndex = useCallback(
    (index: number) => {
      const location = locations[index];
      if (!location) return;
      selectLocation(location);
    },
    [locations, selectLocation],
  );
  useMapClusters({ map, isLoaded, geojson, onSelectIndex: selectLocationByIndex });

  const resetView = useCallback(() => {
    setSelectedLocation(null);
    map?.flyTo({
      center: MAP_CONFIG.mapbox.center,
      zoom: MAP_CONFIG.mapbox.resetZoom,
      duration: 800,
    });
  }, [map]);

  useDebouncedResize(
    useCallback(() => {
      map?.resize();
    }, [map]),
  );
  const hasError = Boolean(error || mapError);
  const showLoading = !hasError && (!isLoaded || isLoading);
  const errorTitle = error ? 'Failed to load locations' : mapError ? 'Failed to load map' : null;
  const errorMessage = error?.message ?? mapError?.message ?? null;
  return (
    <section className="relative w-full bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <MapIntro />
        <MapViewport
          mapContainerRef={mapContainer}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setShowList(false);
            setSearchQuery('');
          }}
          filteredLocations={filteredLocations}
          locations={locations}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          categoryCounts={categoryCounts}
          showLoading={showLoading}
          selectedLocation={selectedLocation}
          selectedIndex={selectedIndex}
          showList={showList}
          isLoaded={isLoaded}
          imageError={imageError}
          onImageError={(id) => setImageError((prev) => new Set(prev).add(id))}
          onCloseSidebar={() => setSelectedLocation(null)}
          onPrevLocation={() => {
            if (!selectedLocation) return;
            const currentList = activeFilter === 'all' ? locations : filteredLocations;
            if (currentList.length === 0) return;
            const currentIdx = currentList.findIndex((loc) => loc.id === selectedLocation.id);
            if (currentIdx < 0) return;
            const prevIdx = (currentIdx - 1 + currentList.length) % currentList.length;
            selectLocation(currentList[prevIdx]);
          }}
          onNextLocation={() => {
            if (!selectedLocation) return;
            const currentList = activeFilter === 'all' ? locations : filteredLocations;
            if (currentList.length === 0) return;
            const currentIdx = currentList.findIndex((loc) => loc.id === selectedLocation.id);
            if (currentIdx < 0) return;
            const nextIdx = (currentIdx + 1) % currentList.length;
            selectLocation(currentList[nextIdx]);
          }}
          onSelectLocation={selectLocation}
          onShowList={setShowList}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          onResetView={resetView}
          map={map}
          errorTitle={errorTitle ?? undefined}
          errorMessage={errorMessage ?? undefined}
        />
      </div>
    </section>
  );
};
