import { useEffect, useState } from 'react';

import { parseLocationsCSV } from '../utils/csvParser';
import type { Location } from '../types';

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const response = await fetch('/munich_places.csv', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load locations (status ${response.status})`);
        }
        const csvText = await response.text();
        const parsed = parseLocationsCSV(csvText);
        setLocations(parsed);
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => controller.abort();
  }, []);

  return { locations, isLoading, error };
};
