import { useEffect, useRef, useState, type RefObject } from 'react';
import type mapboxgl from 'mapbox-gl';

import { MAP_CONFIG } from '../../../constants/map';

let mapboxglModule: typeof mapboxgl | null = null;

interface UseMapboxOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  onEmptyClick?: () => void;
}

export const useMapbox = ({ containerRef, onEmptyClick }: UseMapboxOptions) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;
    let mapInstance: mapboxgl.Map | null = null;

    const initMap = async () => {
      try {
        if (!mapboxglModule) {
          const mapboxModule = await import('mapbox-gl');
          mapboxglModule = mapboxModule.default;
        }

        if (!mapboxglModule || !containerRef.current || !isMounted) return;

        mapInstance = new mapboxglModule.Map({
          container: containerRef.current,
          style: MAP_CONFIG.mapbox.style,
          center: MAP_CONFIG.mapbox.center,
          zoom: MAP_CONFIG.mapbox.zoom,
          pitch: 0,
          bearing: 0,
          antialias: false,
          accessToken: MAP_CONFIG.mapbox.token,
          fadeDuration: 0,
          trackResize: true,
        });

        mapInstance.dragRotate.disable();
        mapInstance.touchZoomRotate.disableRotation();

        if (mapInstance.isStyleLoaded()) {
          setIsLoaded(true);
        } else {
          mapInstance.once('load', () => {
            if (!isMounted) return;
            setIsLoaded(true);
          });
        }

        mapInstance.on('error', (event) => {
          if (!isMounted) return;
          const mapError = event?.error ?? new Error('Map failed to load');
          setError(mapError);
        });

        if (onEmptyClick) {
          mapInstance.on('click', (event) => {
            const features = mapInstance?.queryRenderedFeatures(event.point, {
              layers: ['clusters', 'unclustered-point'],
            });
            if (!features || features.length === 0) {
              onEmptyClick();
            }
          });
        }

        mapRef.current = mapInstance;
        setMap(mapInstance);
      } catch (err) {
        if (!isMounted) return;
        setError(err as Error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
      mapRef.current = null;
      setMap(null);
    };
  }, [containerRef, onEmptyClick]);

  return { map, isLoaded, error };
};
