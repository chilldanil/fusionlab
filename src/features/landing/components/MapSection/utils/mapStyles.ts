import type { CircleLayer, SymbolLayer } from 'mapbox-gl';

export const getClusterLayers = () => {
  const clusters: CircleLayer = {
    id: 'clusters',
    type: 'circle',
    source: 'locations',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#0b1220',
        10,
        '#1f2937',
        50,
        '#374151',
        100,
        '#4b2e83',
        200,
        '#58151a',
      ],
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 25, 50, 32, 100, 40, 200, 48],
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.9,
    },
  };

  const clusterCount: SymbolLayer = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'locations',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['step', ['get', 'point_count'], 13, 10, 14, 50, 16, 100, 18, 200, 20],
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0, 0, 0, 0.5)',
      'text-halo-width': 1.5,
    },
  };

  const unclusteredPoint: CircleLayer = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'locations',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': 10,
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.95,
    },
  };

  return { clusters, clusterCount, unclusteredPoint };
};
