import { useEffect, useRef, useCallback } from 'react';
import type { Map } from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Red wine / burgundy color
const WINE_COLOR = '#722F37';
const WINE_COLOR_LIGHT = 'rgba(114, 47, 55, 0.35)';
const WINE_COLOR_STROKE = 'rgba(114, 47, 55, 0.9)';

// Theresienstraße 90, 80333 München coordinates (48°09'02.2"N 11°34'02.7"E)
const BUILDING_COORDINATES: [number, number] = [11.5674, 48.1506];

// Approximate Maxvorstadt neighborhood boundaries
const MAXVORSTADT_POLYGON: [number, number][] = [
  [11.5550, 48.1420],
  [11.5550, 48.1580],
  [11.5700, 48.1600],
  [11.5850, 48.1580],
  [11.5850, 48.1480],
  [11.5800, 48.1420],
  [11.5700, 48.1400],
  [11.5550, 48.1420],
];

export interface ModelTransformConfig {
  offsetX: number;      // Longitude offset (meters equivalent)
  offsetY: number;      // Latitude offset (meters equivalent)
  offsetZ: number;      // Altitude offset
  scale: number;        // Model scale
  rotateX: number;      // Rotation X (degrees)
  rotateY: number;      // Rotation Y (degrees)
  rotateZ: number;      // Rotation Z (degrees)
}

export const DEFAULT_TRANSFORM: ModelTransformConfig = {
  offsetX: 15,
  offsetY: -25,
  offsetZ: 5,
  scale: 1.5,
  rotateX: 90,
  rotateY: 335,
  rotateZ: 0,
};

interface UseBuildingHighlightOptions {
  map: Map | null;
  isLoaded: boolean;
  transformConfig?: ModelTransformConfig;
}

// Store for current transform (module-level for render function access)
let currentTransform: ModelTransformConfig = { ...DEFAULT_TRANSFORM };

export const useBuildingHighlight = ({
  map,
  isLoaded,
  transformConfig = DEFAULT_TRANSFORM
}: UseBuildingHighlightOptions) => {
  const modelAddedRef = useRef(false);

  // Update transform when config changes
  useEffect(() => {
    currentTransform = { ...transformConfig };
    if (map) {
      map.triggerRepaint();
    }
  }, [transformConfig, map]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const timeoutId = setTimeout(() => {
      addHighlightLayers();
    }, 100);

    const addHighlightLayers = () => {
      try {
        if (map.getSource('maxvorstadt-neighborhood')) return;

        // Add neighborhood polygon source
        map.addSource('maxvorstadt-neighborhood', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Maxvorstadt' },
            geometry: {
              type: 'Polygon',
              coordinates: [MAXVORSTADT_POLYGON],
            },
          },
        });

        // Add building point source for marker
        map.addSource('building-marker', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              name: 'Theresienstraße 90',
              address: 'Theresienstraße 90, 80333 München',
            },
            geometry: {
              type: 'Point',
              coordinates: BUILDING_COORDINATES,
            },
          },
        });

        // Find the first symbol layer to insert below labels
        const layers = map.getStyle()?.layers;
        let firstSymbolId: string | undefined;
        if (layers) {
          for (const layer of layers) {
            if (layer.type === 'symbol') {
              firstSymbolId = layer.id;
              break;
            }
          }
        }

        // Layer 1: Neighborhood fill
        map.addLayer(
          {
            id: 'maxvorstadt-fill',
            type: 'fill',
            source: 'maxvorstadt-neighborhood',
            paint: {
              'fill-color': WINE_COLOR_LIGHT,
              'fill-opacity': 1,
            },
          },
          firstSymbolId
        );

        // Layer 2: Neighborhood border
        map.addLayer(
          {
            id: 'maxvorstadt-border',
            type: 'line',
            source: 'maxvorstadt-neighborhood',
            paint: {
              'line-color': WINE_COLOR_STROKE,
              'line-width': 4,
              'line-dasharray': [4, 2],
            },
          },
          firstSymbolId
        );

        // Layer 3: Building marker outer ring
        map.addLayer({
          id: 'building-marker-outer',
          type: 'circle',
          source: 'building-marker',
          paint: {
            'circle-radius': 24,
            'circle-color': WINE_COLOR,
            'circle-opacity': 0.4,
            'circle-stroke-width': 2,
            'circle-stroke-color': WINE_COLOR,
          },
        });

        // Building marker inner dot
        map.addLayer({
          id: 'building-marker-inner',
          type: 'circle',
          source: 'building-marker',
          paint: {
            'circle-radius': 12,
            'circle-color': WINE_COLOR,
            'circle-opacity': 1,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Layer 4: Building label
        map.addLayer({
          id: 'building-label',
          type: 'symbol',
          source: 'building-marker',
          layout: {
            'text-field': 'Theresienstraße 90',
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-offset': [0, -3],
            'text-anchor': 'bottom',
          },
          paint: {
            'text-color': WINE_COLOR,
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        // Add 3D model layer using Three.js
        if (!modelAddedRef.current) {
          modelAddedRef.current = true;
          add3DModelLayer(map);
        }

        console.log('Building highlight layers added successfully');
      } catch (error) {
        console.error('Error adding highlight layers:', error);
      }
    };

    return () => {
      clearTimeout(timeoutId);

      const layersToRemove = [
        'building-label',
        'building-marker-inner',
        'building-marker-outer',
        'maxvorstadt-border',
        'maxvorstadt-fill',
        '3d-model',
      ];

      const sourcesToRemove = [
        'building-marker',
        'maxvorstadt-neighborhood',
      ];

      layersToRemove.forEach((layer) => {
        if (map.getLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      sourcesToRemove.forEach((source) => {
        if (map.getSource(source)) {
          map.removeSource(source);
        }
      });

      modelAddedRef.current = false;
    };
  }, [map, isLoaded]);

  const logCurrentTransform = useCallback(() => {
    console.log('Current Transform Config:', JSON.stringify(currentTransform, null, 2));
  }, []);

  return { logCurrentTransform };
};

function add3DModelLayer(map: Map) {
  const modelOrigin = BUILDING_COORDINATES;
  const modelAltitude = 0;

  const baseMercator = mercatorFromLngLat(modelOrigin[0], modelOrigin[1], modelAltitude);

  // Three.js setup
  const camera = new THREE.Camera();
  const scene = new THREE.Scene();
  let renderer: THREE.WebGLRenderer;

  const customLayer = {
    id: '3d-model',
    type: 'custom' as const,
    renderingMode: '3d' as const,
    onAdd: function (_map: Map, gl: WebGLRenderingContext) {
      // Soft ambient lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      // Subtle directional light from above (like soft sunlight)
      const directionalLight = new THREE.DirectionalLight(0xfff5e6, 0.4);
      directionalLight.position.set(50, 100, 50);
      scene.add(directionalLight);

      // Fill light from opposite side
      const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.2);
      fillLight.position.set(-50, 50, -50);
      scene.add(fillLight);

      // Load the GLB model
      const loader = new GLTFLoader();
      loader.load(
        '/hvhaus.glb',
        (gltf) => {
          const model = gltf.scene;

          // Apply wine color with matte finish
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.color = new THREE.Color(WINE_COLOR);
                material.metalness = 0;
                material.roughness = 1;
              }
            }
          });

          scene.add(model);
          console.log('3D model loaded successfully');
        },
        undefined,
        (error) => {
          console.error('Error loading 3D model:', error);
        }
      );

      // Renderer
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });

      renderer.autoClear = false;
    },
    render: function (_gl: WebGLRenderingContext, matrix: number[]) {
      const meterScale = baseMercator.meterInMercatorCoordinateUnits();

      // Apply offset in mercator coordinates
      const offsetX = currentTransform.offsetX * meterScale;
      const offsetY = currentTransform.offsetY * meterScale;
      const offsetZ = currentTransform.offsetZ * meterScale;

      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        (currentTransform.rotateX * Math.PI) / 180
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        (currentTransform.rotateY * Math.PI) / 180
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        (currentTransform.rotateZ * Math.PI) / 180
      );

      const scale = meterScale * currentTransform.scale;

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          baseMercator.x + offsetX,
          baseMercator.y + offsetY,
          baseMercator.z + offsetZ
        )
        .scale(new THREE.Vector3(scale, -scale, scale))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      camera.projectionMatrix = m.multiply(l);
      renderer.resetState();
      renderer.render(scene, camera);
      map.triggerRepaint();
    },
  };

  map.addLayer(customLayer);
}

function mercatorFromLngLat(lng: number, lat: number, altitude: number) {
  const earthRadius = 6371008.8;
  const earthCircumference = 2 * Math.PI * earthRadius;

  const x = (lng + 180) / 360;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - (0.25 * Math.log((1 + sinLat) / (1 - sinLat))) / Math.PI;
  const z = altitude / earthCircumference;

  return {
    x,
    y,
    z,
    meterInMercatorCoordinateUnits: () => 1 / earthCircumference,
  };
}

export const HIGHLIGHT_CONFIG = {
  buildingCoordinates: BUILDING_COORDINATES,
  wineColor: WINE_COLOR,
};
