import { useEffect } from 'react';
import type { GeoJSONSource, Map, MapLayerMouseEvent } from 'mapbox-gl';
import type { FeatureCollection, Point } from 'geojson';

import { MAP_CONFIG } from '../../../constants/map';
import { getClusterLayers } from '../utils/mapStyles';

interface UseMapClustersOptions {
  map: Map | null;
  isLoaded: boolean;
  geojson: FeatureCollection<Point>;
  onSelectIndex: (index: number) => void;
}

export const useMapClusters = ({ map, isLoaded, geojson, onSelectIndex }: UseMapClustersOptions) => {
  useEffect(() => {
    if (!map || !isLoaded) return;

    const existingSource = map.getSource('locations');
    if (existingSource && 'setData' in existingSource) {
      (existingSource as GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource('locations', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: MAP_CONFIG.clustering.maxZoom,
      clusterRadius: MAP_CONFIG.clustering.radius,
    });

    const { clusters, clusterCount, unclusteredPoint } = getClusterLayers();
    map.addLayer(clusters);
    map.addLayer(clusterCount);
    map.addLayer(unclusteredPoint);
  }, [geojson, isLoaded, map]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!map.getLayer('clusters') || !map.getLayer('unclustered-point')) return;

    const handleClusterClick = (event: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: ['clusters'] });
      const clusterId = Number(features[0]?.properties?.cluster_id);
      const source = map.getSource('locations');

      if (!Number.isFinite(clusterId) || !source || !('getClusterExpansionZoom' in source)) return;

      (source as GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        if (typeof zoom !== 'number') return;
        const coords = (features[0]?.geometry as Point | undefined)?.coordinates as [number, number] | undefined;
        if (!coords) return;
        map.easeTo({ center: coords, zoom });
      });
    };

    const handlePointClick = (event: MapLayerMouseEvent) => {
      const features = event.features;
      if (!features || features.length === 0) return;
      const index = Number(features[0].properties?.index);
      if (Number.isFinite(index)) {
        onSelectIndex(index);
      }
    };

    const handleCursor = (cursor: string) => {
      map.getCanvas().style.cursor = cursor;
    };

    const handleClusterEnter = () => handleCursor('pointer');
    const handleClusterLeave = () => handleCursor('');
    const handlePointEnter = () => handleCursor('pointer');
    const handlePointLeave = () => handleCursor('');

    map.on('click', 'clusters', handleClusterClick);
    map.on('click', 'unclustered-point', handlePointClick);
    map.on('mouseenter', 'clusters', handleClusterEnter);
    map.on('mouseleave', 'clusters', handleClusterLeave);
    map.on('mouseenter', 'unclustered-point', handlePointEnter);
    map.on('mouseleave', 'unclustered-point', handlePointLeave);

    return () => {
      map.off('click', 'clusters', handleClusterClick);
      map.off('click', 'unclustered-point', handlePointClick);
      map.off('mouseenter', 'clusters', handleClusterEnter);
      map.off('mouseleave', 'clusters', handleClusterLeave);
      map.off('mouseenter', 'unclustered-point', handlePointEnter);
      map.off('mouseleave', 'unclustered-point', handlePointLeave);
    };
  }, [isLoaded, map, onSelectIndex]);
};
