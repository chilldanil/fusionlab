export const MAP_CONFIG = {
  mapbox: {
    token:
      'pk.eyJ1IjoiY2hpbGxkYW5pbGwiLCJhIjoiY21ncjA3Y2p1MWR0ejJrcjJlY256aHQ5OCJ9.MifgRZvzxeSnRKektuI2sQ',
    center: [11.5755, 48.1374] as [number, number],
    zoom: 14,
    resetZoom: 12,
    detailZoom: 16,
    style: 'mapbox://styles/mapbox/light-v11',
  },
  clustering: {
    maxZoom: 14,
    radius: 50,
  },
} as const;
