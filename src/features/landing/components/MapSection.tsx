import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hpbGxkYW5pbGwiLCJhIjoiY21ncjA3Y2p1MWR0ejJrcjJlY256aHQ5OCJ9.MifgRZvzxeSnRKektuI2sQ';

// Dynamic import workaround for mapbox-gl with Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapboxgl: any = null;

type CategoryType = 
    | 'cafe' | 'bar' | 'restaurant' | 'museum' | 'art_gallery' 
    | 'spa' | 'gym' | 'bakery' | 'church' | 'tourist_attraction' 
    | 'park' | 'book_store' | 'night_club' | 'library' | 'shopping_mall'
    | 'movie_theater' | 'casino' | 'amusement_park' | 'stadium' | 'bowling_alley'
    | 'aquarium' | 'zoo' | 'synagogue';

interface Location {
    id: number;
    name: string;
    category: CategoryType;
    address: string;
    description: string;
    coordinates: [number, number];
    rating?: number;
    photoUrl?: string;
    googleMapsLink?: string;
}

// Category SVG icons
const CategoryIcons = {
    cafe: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
    ),
    bar: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8" />
            <path d="M12 11v11" />
            <path d="m19 3-7 8-7-8Z" />
        </svg>
    ),
    restaurant: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    ),
    museum: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
        </svg>
    ),
    art_gallery: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    spa: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    gym: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11v11h-11z" />
            <path d="M6.5 6.5L12 12l5.5-5.5M6.5 17.5L12 12l5.5 5.5" />
        </svg>
    ),
    bakery: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M8 8h8M8 12h8M8 16h8" />
            <circle cx="12" cy="6" r="2" />
        </svg>
    ),
    church: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M3 12h18M8 8l4-4 4 4M8 16l4 4 4-4" />
        </svg>
    ),
    tourist_attraction: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    park: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
    ),
    book_store: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    night_club: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
    ),
    library: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
    ),
    shopping_mall: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6v6H9z" />
        </svg>
    ),
    movie_theater: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M17 2v5M7 2v5M2 12h20" />
        </svg>
    ),
    casino: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v20M2 12h20" />
        </svg>
    ),
    amusement_park: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M8 8h8M8 12h8M8 16h8" />
            <circle cx="12" cy="6" r="2" />
        </svg>
    ),
    stadium: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="10" ry="6" />
            <path d="M2 12h20" />
        </svg>
    ),
    bowling_alley: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    aquarium: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10h18M3 14h18M5 6h14v12H5z" />
        </svg>
    ),
    zoo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    synagogue: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M3 12h18M8 8l4-4 4 4M8 16l4 4 4-4" />
        </svg>
    ),
};

// Category display names and colors
const categoryConfig: Record<CategoryType, { label: string; color: string }> = {
    cafe: { label: 'Café', color: '#92400e' },
    bar: { label: 'Bar', color: '#1e1b4b' },
    restaurant: { label: 'Restaurant', color: '#166534' },
    museum: { label: 'Museum', color: '#581c87' },
    art_gallery: { label: 'Art Gallery', color: '#9f1239' },
    spa: { label: 'Spa', color: '#7c2d12' },
    gym: { label: 'Gym', color: '#1e3a8a' },
    bakery: { label: 'Bakery', color: '#78350f' },
    church: { label: 'Church', color: '#4c1d95' },
    tourist_attraction: { label: 'Attraction', color: '#be123c' },
    park: { label: 'Park', color: '#14532d' },
    book_store: { label: 'Book Store', color: '#7c2d12' },
    night_club: { label: 'Night Club', color: '#581c87' },
    library: { label: 'Library', color: '#1e40af' },
    shopping_mall: { label: 'Shopping', color: '#7c3aed' },
    movie_theater: { label: 'Cinema', color: '#be185d' },
    casino: { label: 'Casino', color: '#991b1b' },
    amusement_park: { label: 'Amusement', color: '#c2410c' },
    stadium: { label: 'Stadium', color: '#1e40af' },
    bowling_alley: { label: 'Bowling', color: '#7c2d12' },
    aquarium: { label: 'Aquarium', color: '#0e7490' },
    zoo: { label: 'Zoo', color: '#166534' },
    synagogue: { label: 'Synagogue', color: '#4c1d95' },
};

// Parse CSV from the database
const parseCSV = (csvText: string): Location[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const nameIdx = headers.indexOf('Name');
    const typeIdx = headers.indexOf('Type');
    const latIdx = headers.indexOf('Latitude');
    const lngIdx = headers.indexOf('Longitude');
    const addressIdx = headers.indexOf('Address');
    const ratingIdx = headers.indexOf('Rating');
    const descIdx = headers.indexOf('Description');
    const photoIdx = headers.indexOf('Photo URL');
    const mapsIdx = headers.indexOf('Google Maps Link');
    
    const locations: Location[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        // Parse CSV properly handling quoted strings
        const row = parseCSVRow(lines[i]);
        if (row.length < 5) continue;
        
        const typeRaw = row[typeIdx]?.toLowerCase().trim();
        if (!typeRaw) continue;
        
        // Map to known category or use fallback
        const typeMap: Record<string, CategoryType> = {
            'cafe': 'cafe',
            'bar': 'bar',
            'restaurant': 'restaurant',
            'museum': 'museum',
            'art_gallery': 'art_gallery',
            'spa': 'spa',
            'gym': 'gym',
            'bakery': 'bakery',
            'church': 'church',
            'tourist_attraction': 'tourist_attraction',
            'park': 'park',
            'book_store': 'book_store',
            'night_club': 'night_club',
            'library': 'library',
            'shopping_mall': 'shopping_mall',
            'movie_theater': 'movie_theater',
            'casino': 'casino',
            'amusement_park': 'amusement_park',
            'stadium': 'stadium',
            'bowling_alley': 'bowling_alley',
            'aquarium': 'aquarium',
            'zoo': 'zoo',
            'synagogue': 'synagogue',
        };
        
        const type = typeMap[typeRaw] || 'cafe'; // Fallback to cafe for unknown types
        
        const lat = parseFloat(row[latIdx]);
        const lng = parseFloat(row[lngIdx]);
        if (isNaN(lat) || isNaN(lng)) continue;
        
        // Get rating (now a separate field)
        const ratingStr = row[ratingIdx];
        const rating = ratingStr ? parseFloat(ratingStr) : undefined;
        
        // Get address (now a separate field)
        const address = row[addressIdx]?.replace(/^"|"$/g, '') || '';
        
        // Get description and clean it from rating info
        let description = row[descIdx]?.replace(/^"|"$/g, '') || '';
        // Remove rating patterns like "Rating: 4.7" or "Rating: 4.7." or "Church. Rating: 4.7."
        description = description
            .replace(/Rating:\s*[\d.]+\.?\s*/gi, '')
            .replace(/\.\s*Rating:\s*[\d.]+\.?\s*/gi, '')
            .replace(/,\s*Rating:\s*[\d.]+\.?\s*/gi, '')
            .replace(/\s*Rating:\s*[\d.]+\.?\s*/gi, '')
            .replace(/\.\s*$/, '') // Remove trailing dot if left
            .trim();
        
        // If description is empty or just category name, use address as fallback
        if (!description || description.length < 10) {
            description = address || '';
        }
        
        locations.push({
            id: i,
            name: row[nameIdx]?.replace(/^"|"$/g, '') || `Location ${i}`,
            category: type,
            address,
            description,
            coordinates: [lng, lat],
            rating,
            photoUrl: row[photoIdx] || undefined,
            googleMapsLink: row[mapsIdx] || undefined,
        });
    }
    
    return locations;
};

// Helper to parse CSV row with quoted values
const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
};

export const MapSection = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [showList, setShowList] = useState(false);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [activeFilter, setActiveFilter] = useState<CategoryType | 'all'>('all');
    const [imageError, setImageError] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Filter by category and search query
    const filteredLocations = (activeFilter === 'all' 
        ? locations 
        : locations.filter(l => l.category === activeFilter)
    ).filter(loc => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            loc.name.toLowerCase().includes(query) ||
            loc.address.toLowerCase().includes(query) ||
            loc.description.toLowerCase().includes(query) ||
            categoryConfig[loc.category].label.toLowerCase().includes(query)
        );
    });

    // Load CSV data
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/munich_places.csv');
                const csvText = await response.text();
                const parsed = parseCSV(csvText);
                setLocations(parsed);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load locations:', error);
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Update map source when filter changes
    useEffect(() => {
        if (!map.current || !isMapLoaded) return;
        
        const source = map.current.getSource('locations');
        if (source && 'setData' in source) {
            const filtered = activeFilter === 'all' 
                ? locations 
                : locations.filter(l => l.category === activeFilter);
            
            const geojson = {
                type: 'FeatureCollection' as const,
                features: filtered.map((loc) => ({
                    type: 'Feature' as const,
                    properties: {
                        id: loc.id,
                        index: locations.findIndex(l => l.id === loc.id),
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
            source.setData(geojson);
        }
    }, [activeFilter, locations, isMapLoaded]);

    const addClusterLayers = useCallback(() => {
        if (!map.current || locations.length === 0) return;

        // Create GeoJSON from locations
        const geojson = {
            type: 'FeatureCollection' as const,
            features: locations.map((loc, idx) => ({
                type: 'Feature' as const,
                properties: {
                    id: loc.id,
                    index: idx,
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

        // Add source with clustering
        map.current.addSource('locations', {
            type: 'geojson',
            data: geojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
        });

        // Cluster circles with gradient colors
        map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'locations',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#0b1220', // very dark navy for small clusters
                    10, '#1f2937', // dark slate for medium
                    50, '#374151', // muted slate for large
                    100, '#4b2e83', // deep muted purple for very large
                    200, '#58151a', // deep maroon for huge
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    10, 25,
                    50, 32,
                    100, 40,
                    200, 48,
                ],
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.9,
            },
        });

        // Cluster count labels with better styling
        map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'locations',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': [
                    'step',
                    ['get', 'point_count'],
                    13,
                    10, 14,
                    50, 16,
                    100, 18,
                    200, 20,
                ],
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': 'rgba(0, 0, 0, 0.5)',
                'text-halo-width': 1.5,
            },
        });

        // Individual points with better styling
        map.current.addLayer({
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
        });

        // Click on cluster to zoom
        map.current.on('click', 'clusters', (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
            const features = map.current!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features[0].properties?.cluster_id;
            const source = map.current!.getSource('locations');
            if (source && 'getClusterExpansionZoom' in source) {
                source.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
                    if (err) return;
                    map.current!.easeTo({
                        center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
                        zoom: zoom,
                    });
                });
            }
        });

        // Click on individual point
        map.current.on('click', 'unclustered-point', (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
            const features = e.features;
            if (!features || features.length === 0) return;
            
            const props = features[0].properties;
            const idx = props?.index;
            if (idx !== undefined && locations[idx]) {
                selectLocation(locations[idx], idx);
            }
        });

        // Cursor changes
        map.current.on('mouseenter', 'clusters', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'clusters', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
        });
        map.current.on('mouseenter', 'unclustered-point', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'unclustered-point', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
        });
    }, [locations]);

    // Initialize map
    useEffect(() => {
        if (map.current || !mapContainer.current || locations.length === 0) return;

        const initMap = async () => {
            const mapboxModule = await import('mapbox-gl');
            mapboxgl = mapboxModule.default;

            map.current = new mapboxgl.Map({
                container: mapContainer.current!,
                style: 'mapbox://styles/mapbox/light-v11',
                center: [11.5755, 48.1374],
                zoom: 14,
                pitch: 0,
                bearing: 0,
                antialias: false, // Disable antialiasing for performance
                accessToken: MAPBOX_TOKEN,
                fadeDuration: 0, // Disable fade animations
                trackResize: true,
            });

            // Disable rotation for performance
            map.current.dragRotate.disable();
            map.current.touchZoomRotate.disableRotation();

            map.current.on('load', () => {
                setIsMapLoaded(true);
                addClusterLayers();
            });

            map.current.on('click', (e: mapboxgl.MapMouseEvent) => {
                // Only close sidebar if clicking on empty space (not on markers)
                const features = map.current?.queryRenderedFeatures(e.point, { 
                    layers: ['clusters', 'unclustered-point'] 
                });
                if (!features || features.length === 0) {
                    setSelectedLocation(null);
                }
            });
        };

        initMap();

        return () => {
            map.current?.remove();
        };
    }, [locations, addClusterLayers]);

    const selectLocation = (location: Location, index: number) => {
        setSelectedLocation(location);
        setSelectedIndex(index);
        setShowList(false);
        setSearchQuery('');

        map.current?.flyTo({
            center: location.coordinates,
            zoom: 16,
            duration: 800,
            essential: true,
        });
    };

    const resetView = () => {
        setSelectedLocation(null);
        map.current?.flyTo({
            center: [11.5755, 48.1374],
            zoom: 12,
            duration: 800,
        });
    };

    // Category counts
    const categoryCounts = locations.reduce((acc, loc) => {
        acc[loc.category] = (acc[loc.category] || 0) + 1;
        return acc;
    }, {} as Record<CategoryType, number>);

    return (
        <section className="relative w-full bg-white py-20 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    viewport={{ once: true }}
                    className="max-w-4xl mb-12"
                >
                    <div className="inline-block mb-6 px-3 py-1 border border-gray-200 rounded-full text-xs font-mono text-gray-500 uppercase tracking-widest">
                        City Explorer
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-8">
                        DISCOVER <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                            MUNICH
                        </span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-2xl font-light leading-relaxed">
                        Explore curated locations across the city. Click any marker to view details,
                        or filter by category to find exactly what you're looking for.
                    </p>
                </motion.div>

                <div className="relative w-full h-[75vh] border border-gray-200 bg-white overflow-hidden">
                    {/* Corner Marks */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-black z-20 pointer-events-none" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-black z-20 pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-black z-20 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-black z-20 pointer-events-none" />

            {/* Section Header */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 text-center px-4 w-full">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center"
                >
                    {/* Category Filters */}
                    <div className="flex flex-wrap items-center justify-center gap-2 bg-white border-2 border-black p-2 max-w-full">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all ${
                                activeFilter === 'all' 
                                    ? 'bg-black text-white border-black' 
                                    : 'bg-white text-black border-gray-300 hover:border-black'
                            }`}
                        >
                            All ({locations.length})
                        </button>
                        {(Object.keys(categoryConfig) as CategoryType[]).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all ${
                                    activeFilter === cat 
                                        ? 'text-white border-black' 
                                        : 'bg-white text-black border-gray-300 hover:border-black'
                                }`}
                                style={{ 
                                    background: activeFilter === cat ? categoryConfig[cat].color : 'white'
                                }}
                            >
                                <span className="w-3.5 h-3.5">{CategoryIcons[cat]}</span>
                                <span className="hidden sm:inline">{categoryConfig[cat].label}</span>
                                <span className="text-[10px]">({categoryCounts[cat] || 0})</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Map Container */}
            <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />
            
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-black border-t-transparent animate-spin" />
                        <span className="font-mono text-xs text-black uppercase tracking-widest font-bold">Loading...</span>
                    </div>
                </div>
            )}

            {/* Location Sidebar */}
            <AnimatePresence>
                {selectedLocation && (
                    <motion.aside
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute top-0 left-0 w-full max-w-md h-full bg-white z-40 border-r-2 border-black flex flex-col"
                    >
                        {/* Image Area */}
                        <div 
                            className="relative h-[55%] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-b-2 border-black"
                            style={{ background: `linear-gradient(135deg, ${categoryConfig[selectedLocation.category].color}15, ${categoryConfig[selectedLocation.category].color}30)` }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedLocation(null)}
                                className="absolute top-4 right-4 w-12 h-12 bg-white hover:bg-black border-2 border-black flex items-center justify-center transition-all group z-30"
                            >
                                <svg className="w-5 h-5 text-black group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                            
                            {/* Location number badge */}
                            <span className="absolute top-4 left-4 font-mono text-xs bg-white text-black px-3 py-2 border-2 border-black font-bold z-30">
                                #{String(selectedIndex + 1).padStart(3, '0')}
                            </span>

                            {/* Blueprint grid pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:16px_16px]" />
                            
                            {/* Photo */}
                            {selectedLocation.photoUrl && !imageError.has(selectedLocation.id) ? (
                                <img 
                                    src={selectedLocation.photoUrl} 
                                    alt={selectedLocation.name}
                                    className="absolute inset-0 w-full h-full object-cover z-10"
                                    onError={() => {
                                        setImageError(prev => new Set(prev).add(selectedLocation.id));
                                    }}
                                />
                            ) : null}
                            
                            {/* Category icon fallback */}
                            <span 
                                className="relative w-32 h-32 opacity-15 z-0"
                                style={{ color: categoryConfig[selectedLocation.category].color }}
                            >
                                {CategoryIcons[selectedLocation.category]}
                            </span>
                        </div>

                        {/* Info Panel */}
                        <div className="flex-1 bg-white px-6 py-5 border-b-2 border-black overflow-y-auto">
                            {/* Tags row */}
                            <div className="flex items-center gap-2 mb-3">
                                <span 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-xs font-mono font-bold uppercase tracking-wider text-white"
                                    style={{ background: categoryConfig[selectedLocation.category].color }}
                                >
                                    <span className="w-3 h-3">{CategoryIcons[selectedLocation.category]}</span>
                                    {categoryConfig[selectedLocation.category].label}
                                </span>
                                {selectedLocation.rating && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-amber-500 text-xs font-mono font-bold bg-amber-50 text-amber-700">
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                        {selectedLocation.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-2xl font-bold tracking-tight text-black mb-2">
                                {selectedLocation.name}
                            </h3>

                            {/* Address */}
                            <p className="text-sm text-gray-700 mb-3 flex items-start gap-2 font-mono">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                {selectedLocation.address}
                            </p>

                            {/* Description */}
                            {selectedLocation.description && (
                                <p className="text-sm text-gray-700 leading-relaxed mb-4 font-light">
                                    {selectedLocation.description}
                                </p>
                            )}

                            {/* Action button */}
                            {selectedLocation.googleMapsLink && (
                                <a 
                                    href={selectedLocation.googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-black text-white text-sm font-mono font-bold uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all group"
                                >
                                    Open in Maps
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="px-6 py-4 border-t-2 border-black flex items-center justify-between bg-gray-50">
                            <button
                                onClick={() => {
                                    const currentList = activeFilter === 'all' ? locations : filteredLocations;
                                    const currentIdx = currentList.findIndex(l => l.id === selectedLocation.id);
                                    const prevIdx = (currentIdx - 1 + currentList.length) % currentList.length;
                                    const prevLoc = currentList[prevIdx];
                                    const globalIdx = locations.findIndex(l => l.id === prevLoc.id);
                                    selectLocation(prevLoc, globalIdx);
                                }}
                                className="flex items-center gap-2 text-sm font-mono font-bold uppercase text-black hover:bg-black hover:text-white px-3 py-2 border-2 border-black transition-all"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                                Prev
                            </button>
                            <span className="font-mono text-xs text-black font-bold border-2 border-black px-3 py-1">
                                {selectedIndex + 1} / {locations.length}
                            </span>
                            <button
                                onClick={() => {
                                    const currentList = activeFilter === 'all' ? locations : filteredLocations;
                                    const currentIdx = currentList.findIndex(l => l.id === selectedLocation.id);
                                    const nextIdx = (currentIdx + 1) % currentList.length;
                                    const nextLoc = currentList[nextIdx];
                                    const globalIdx = locations.findIndex(l => l.id === nextLoc.id);
                                    selectLocation(nextLoc, globalIdx);
                                }}
                                className="flex items-center gap-2 text-sm font-mono font-bold uppercase text-black hover:bg-black hover:text-white px-3 py-2 border-2 border-black transition-all"
                            >
                                Next
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isMapLoaded ? 1 : 0, y: isMapLoaded ? 0 : 20 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center gap-3 bg-white border-2 border-black p-1"
                >
                    <button
                        onClick={() => {
                            setShowList(false);
                            setSearchQuery('');
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
                        onClick={() => setShowList(true)}
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

            {/* List Panel */}
            <AnimatePresence>
                {showList && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-3xl max-h-96 bg-white border-2 border-black overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-white">
                            <h3 className="font-mono font-bold text-black uppercase tracking-wider">
                                {activeFilter === 'all' ? 'All Locations' : categoryConfig[activeFilter].label}
                            </h3>
                            <span className="font-mono text-xs text-black font-bold uppercase tracking-wider bg-gray-100 border border-black px-3 py-1">
                                {filteredLocations.length}
                            </span>
                        </div>
                        
                        {/* Search Input */}
                        <div className="px-6 py-3 border-b-2 border-black bg-gray-50">
                            <div className="relative">
                                <svg 
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 text-sm font-mono bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-gray-300"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-black hover:bg-gray-200 border border-black"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto bg-white">
                            {filteredLocations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                    <svg className="w-16 h-16 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <p className="text-sm font-mono font-bold text-black uppercase tracking-wider mb-1">No Results</p>
                                    <p className="text-xs font-mono text-gray-500">Try different filters</p>
                                </div>
                            ) : (
                                filteredLocations.map((loc) => {
                                    const globalIndex = locations.findIndex(l => l.id === loc.id);
                                    return (
                                        <div
                                            key={loc.id}
                                            onClick={() => selectLocation(loc, globalIndex)}
                                            className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors border-b-2 border-gray-200 last:border-b-0 group"
                                        >
                                            <span 
                                                className="w-6 h-6 flex-shrink-0 p-1 border-2 border-black"
                                                style={{ color: categoryConfig[loc.category].color, background: `${categoryConfig[loc.category].color}20` }}
                                            >
                                                {CategoryIcons[loc.category]}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm text-black truncate">{loc.name}</div>
                                                <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-2">
                                                    {categoryConfig[loc.category].label}
                                                    {loc.rating && (
                                                        <span className="flex items-center gap-0.5 text-amber-600">
                                                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                            </svg>
                                                            {loc.rating}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-black group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right Controls */}
            <div className="absolute top-1/2 right-6 -translate-y-1/2 z-30 flex flex-col gap-0">
                {/* Zoom controls */}
                <button
                    onClick={() => map.current?.zoomIn({ duration: 400 })}
                    className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-black transition-all group"
                    title="Zoom in"
                >
                    <svg className="w-5 h-5 text-black group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <button
                    onClick={() => map.current?.zoomOut({ duration: 400 })}
                    className="w-12 h-12 bg-white border-2 border-black border-t-0 flex items-center justify-center hover:bg-black transition-all group"
                    title="Zoom out"
                >
                    <svg className="w-5 h-5 text-black group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                
                <div className="h-2" />
                
                {/* Reset view */}
                <button
                    onClick={resetView}
                    className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-black transition-all group"
                    title="Reset view"
                >
                    <svg className="w-5 h-5 text-black group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
            </div>

            {/* Progress Indicator */}
            <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-2">
                <span className="font-mono text-xs text-black font-bold bg-white border-2 border-black px-2 py-1">
                    {filteredLocations.length} / {locations.length}
                </span>
                <div className="w-32 h-2 bg-white border-2 border-black overflow-hidden">
                    <motion.div
                        className="h-full bg-black"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(filteredLocations.length / Math.max(locations.length, 1)) * 100}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
            </div>

                    {/* Hide Mapbox controls */}
                    <style>{`
                        .mapboxgl-ctrl-attrib,
                        .mapboxgl-ctrl-logo {
                            display: none !important;
                        }
                    `}</style>
                </div>
            </div>
        </section>
    );
};
