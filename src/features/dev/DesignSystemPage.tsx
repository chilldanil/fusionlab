import { useEffect, useRef, useState } from 'react';
import '@ifc-viewer/core/styles';
import './designSystem.css';
import { Button } from '../../shared/ui/Button';
import { SchematicAvatar } from '../../shared/ui/SchematicAvatar';
import { EventCard } from '../events/components/EventCard';
import { ConnectButton } from '../social/components/ConnectButton';
import { AnimatedCircuitBackground } from '../landing/components/AnimatedCircuitBackground';
import { createIFCViewer, type ViewerHandle } from '@ifc-viewer/core';
import type { Event } from '../events/types';

// --- MOCK DATA ---
const mockProposal: Event = {
    id: '1',
    title: 'Hackathon: AI for Good',
    description: 'A 48-hour marathon to build solutions for non-profits using local LLMs.',
    event_date: new Date(Date.now() + 86400000 * 25).toISOString(), // +25 days
    created_at: new Date().toISOString(),
    creator_id: 'user-1',
    status: 'proposal',
    votes: [{ count: 7 }],
    user_has_voted: false,
    user_has_joined: false,
};

const mockConfirmed: Event = {
    ...mockProposal,
    id: '2',
    title: 'Soldering Workshop v2',
    status: 'confirmed',
    votes: [{ count: 15 }],
    event_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    user_has_joined: true,
};

const viewerTheme: Record<string, string> = {
    '--sidebar-bg': '#f7f7f3',
    '--sidebar-surface': '#ffffff',
    '--sidebar-surface-muted': '#f1f1ed',
    '--sidebar-surface-hover': '#ecece7',
    '--sidebar-border': 'rgba(0, 0, 0, 0.12)',
    '--sidebar-border-strong': 'rgba(0, 0, 0, 0.4)',
    '--sidebar-divider': 'rgba(0, 0, 0, 0.16)',
    '--sidebar-text': '#000000',
    '--sidebar-text-muted': '#000000',
    '--sidebar-text-subtle': '#000000',
    '--sidebar-accent': '#000000',
    '--sidebar-accent-soft': 'rgba(0, 0, 0, 0.06)',
    '--sidebar-accent-strong': 'rgba(0, 0, 0, 0.35)',
    '--sidebar-danger': '#c1121f',
    '--sidebar-warning': '#d97706',
    '--sidebar-success': '#0f8f5d',
    '--sidebar-info': '#1f6feb',
    '--sidebar-radius': '0px',
    '--sidebar-control-height': '38px',
    '--sidebar-control-bg': '#ffffff',
    '--sidebar-control-hover': '#000000',
    '--ifc-surface': '#ffffff',
    '--ifc-surface-hover': '#f3f3ef',
    '--ifc-surface-border': 'rgba(0, 0, 0, 0.12)',
    '--ifc-text-primary': '#000000',
    '--ifc-text-muted': '#000000',
    '--ifc-accent': '#000000',
    '--ifc-background': '#f6f6f3',
};

type FeatureFont = 'mono' | 'sans';

const featureFontFamilies: Record<FeatureFont, string> = {
    mono: '"IBM Plex Mono", "Space Mono", monospace',
    sans: '"Inter", "Space Grotesk", sans-serif',
};

const viewerFeatureList = [
    { title: 'Relations Tree', description: 'Traverse the full IFC hierarchy to focus on the systems you care about.' },
    { title: 'Visibility Controls', description: 'Toggle categories, disciplines, or saved sets without touching raw IFC data.' },
    { title: 'Element Colors', description: 'Apply semantic palettes to highlight statuses, clashes, or ownership.' },
    { title: 'Render Modes', description: 'Swap between shaded, wireframe, and x-ray presets to inspect complex assemblies.' },
    { title: 'Camera', description: 'Lock to preset views or orbit freely with smooth easing for demos.' },
    { title: 'Floor Plan View', description: 'Slice per-level orthographic planes for precise spatial coordination.' },
    { title: 'Measurement Tools', description: 'Capture ad-hoc lengths, areas, and volumes with contextual readouts.' },
    { title: 'Performance', description: 'Monitor FPS, triangles, and GPU timings to keep heavy models responsive.' },
    { title: 'View Cube', description: 'Jump to canonical orientations instantly during reviews.' },
    { title: 'Screenshot', description: 'Export annotated viewport snapshots for async updates.' },
    { title: 'Minimap', description: 'Retain spatial awareness inside megaprojects with a persistent locator.' },
    { title: 'Clipping', description: 'Layer boolean planes to expose interiors without duplicating files.' },
    { title: 'Model Transform', description: 'Reposition, rotate, or scale references when federating packages.' },
    { title: 'Element Properties (Editable)', description: 'Inspect and edit metadata inline with immediate syncing.' },
    { title: 'Export Modified IFC', description: 'Capture deltas and generate clean IFCs for downstream teams.' },
    { title: 'AI Visualizer', description: 'Blend procedural renders with natural-language prompts for ideation.' },
];

const IfcViewerPreview = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<ViewerHandle | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Check if viewer already exists
        if (viewerRef.current) return;

        // Set the base path for web-ifc WASM files
        if (typeof window !== 'undefined') {
            (window as any).WEB_IFC_BASE_PATH = window.location.origin + '/';
        }

        try {
            const viewer = createIFCViewer({
                container,
                theme: viewerTheme,
                // NEW: Use appearance API for better control
                appearance: {
                    world: {
                        backgroundColor: '#ffffff',
                        // Increase ambient light for overall brightness
                        ambientLightColor: '#ffffff',
                        ambientLightIntensity: 0.8, // Higher value = brighter (0.0 to 1.0)
                        // Directional light for shadows and definition
                        directionalLightColor: '#ffffff',
                        directionalLightIntensity: 1.2, // Boost directional light intensity
                        directionalLightPosition: [20, 35, 10],
                    },
                    grid: {
                        enabled: true,
                        color: '#000000',
                        primarySize: 5,
                        secondarySize: 1,
                        distance: 200,
                    },
                    viewCube: {
                        faceColor: 0xffffff,
                        hoverColor: 0xf3f3ef,
                        outlineColor: 0x000000,
                        hoverHighlightColor: 0x000000,
                        labelColor: '#000000',
                        labelBackground: 'rgba(255, 255, 255, 0.98)',
                        labelBorderColor: 'rgba(0, 0, 0, 0.18)',
                        labelFont: '"IBM Plex Mono", "Space Mono", monospace',
                    },
                },
                features: {
                    minimap: false,
                    measurement: false,
                    clipping: true,
                    floorplans: true,
                    aiVisualizer: false,
                },
            });
            viewerRef.current = viewer;
        } catch (error) {
            console.error('Failed to initialize IFC viewer:', error);
        }

        // Don't clean up the viewer - keep it alive
        return undefined;
    }, []);

    const handleLoadModel = async () => {
        if (!viewerRef.current) {
            console.error('Viewer not initialized');
            return;
        }

        setIsLoading(true);
        try {
            await viewerRef.current.loadModelFromUrl('/small-modified.ifc');
        } catch (error) {
            console.error('Failed to load model:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div ref={containerRef} className="absolute inset-0" />
            <button
                onClick={handleLoadModel}
                disabled={isLoading}
                className="absolute top-4 right-4 px-4 py-2 bg-white border border-black text-sm font-mono font-semibold hover:bg-black hover:!text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Loading...' : 'Load HV Model'}
            </button>
        </>
    );
};

export const DesignSystemPage = () => {
    const [featureAccent, setFeatureAccent] = useState('#050505');
    const [featureFont, setFeatureFont] = useState<FeatureFont>('mono');
    const currentFontFamily = featureFontFamilies[featureFont];

    return (
        <div className="min-h-screen bg-gray-50 p-12 font-sans text-black relative overflow-hidden">
            <AnimatedCircuitBackground />
            <div className="max-w-5xl mx-auto space-y-16 relative z-10">

                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold font-mono mb-2">Design System v1.0</h1>
                    <p className="text-gray-500 font-mono uppercase tracking-widest">Engineering Blueprint / Monochrome</p>
                </div>

                {/* 1. Typography */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">01. Typography</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="text-6xl font-bold tracking-tight">Heading 1</p>
                            <p className="text-4xl font-bold tracking-tight">Heading 2</p>
                            <p className="text-2xl font-bold">Heading 3</p>
                            <p className="text-xl font-bold">Heading 4</p>
                        </div>
                        <div className="space-y-4">
                            <p className="font-mono text-sm text-gray-500 uppercase tracking-wider">Monospace Label</p>
                            <p className="text-base leading-relaxed text-gray-600">
                                Body text. A precision-engineered workspace for creators, innovators, and builders.
                                Designed for the next generation of technical excellence.
                            </p>
                            <p className="text-xs text-gray-400 font-mono">Caption / Metadata text</p>
                        </div>
                    </div>
                </section>

                {/* 2. Buttons & States */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">02. Interactive Elements</h2>

                    <div className="space-y-4">
                        <h3 className="font-mono text-xs text-gray-400 uppercase">Main Buttons</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="primary">Primary Action</Button>
                            <Button variant="outline">Secondary Action</Button>
                            <Button variant="primary" disabled>Disabled</Button>
                            <Button variant="outline" disabled>Disabled</Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-mono text-xs text-gray-400 uppercase">Context Buttons</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <ConnectButton status="idle" />
                            <ConnectButton status="pending" />
                            <ConnectButton status="connected" />
                        </div>
                    </div>
                </section>

                {/* 3. Avatars */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">03. Identity</h2>
                    <div className="flex gap-8 items-end">
                        <div className="text-center space-y-2">
                            <SchematicAvatar seed="Alex" size={80} className="border border-black" />
                            <p className="font-mono text-xs">Size 80</p>
                        </div>
                        <div className="text-center space-y-2">
                            <SchematicAvatar seed="Maria" size={48} className="border border-gray-300" />
                            <p className="font-mono text-xs">Size 48</p>
                        </div>
                        <div className="text-center space-y-2">
                            <SchematicAvatar seed="John" size={32} className="border border-gray-300" />
                            <p className="font-mono text-xs">Size 32</p>
                        </div>
                    </div>
                </section>

                {/* 4. Cards */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">04. Components</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-gray-400 uppercase">Event Proposal</p>
                            <EventCard event={mockProposal} isVoting={false} />
                        </div>
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-gray-400 uppercase">Confirmed Event</p>
                            <EventCard event={mockConfirmed} isJoining={false} />
                        </div>
                    </div>
                </section>

                {/* 5. Inputs (Visual Check) */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">05. Forms</h2>
                    <div className="max-w-md space-y-4 p-6 bg-white border border-gray-200">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">Input Field</label>
                            <input
                                type="text"
                                placeholder="Placeholder text..."
                                className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">Error State</label>
                            <input
                                type="text"
                                defaultValue="Invalid value"
                                className="w-full border border-red-500 text-red-600 px-3 py-2 text-sm font-mono focus:outline-none"
                            />
                            <p className="text-xs text-red-500 font-mono mt-1">Validation error message</p>
                        </div>
                    </div>
                </section>

                {/* 6. Blocks */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">06. Blocks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-gray-400 uppercase">Profile Block</p>
                            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-lg font-bold">Primary Container</p>
                                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Used in Profile views and edits</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-gray-600">
                                    This block uses a bold black border with an offset shadow to match the blueprint aesthetic.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="font-mono text-xs text-gray-400 uppercase">IFC Viewer Block</p>
                        <div className="relative left-1/2 right-1/2 -ml-[50vw] w-screen">
                            <div className="px-6 sm:px-12 lg:px-24">
                                <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden min-h-[600px]">
                                    <div className="p-4 border-b border-gray-100">
                                        <p className="text-sm font-semibold">Embedded IFC Viewer</p>
                                        <p className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">
                                            Renders BIM models inside the primary container
                                        </p>
                                    </div>
                                <div className="relative flex-1 min-h-[700px] ifc-viewer-embed">
                                        <IfcViewerPreview />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. IFC Viewer Controls */}
                <section className="space-y-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <h2 className="text-xl font-bold border-b border-black pb-2 lg:border-none lg:pb-0 mb-0">07. IFC Viewer Controls</h2>
                        <div className="viewer-feature-controls">
                            <label className="viewer-feature-control">
                                <span>Font Color</span>
                                <input
                                    type="color"
                                    value={featureAccent}
                                    onChange={(event) => setFeatureAccent(event.target.value)}
                                    aria-label="Select font color"
                                />
                                <span className="viewer-feature-control-value">{featureAccent.toUpperCase()}</span>
                            </label>
                            <div className="viewer-font-toggle" role="group" aria-label="Font style toggle">
                                {(['mono', 'sans'] as const).map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`viewer-font-toggle__btn ${featureFont === option ? 'is-active' : ''}`}
                                        onClick={() => setFeatureFont(option)}
                                    >
                                        {option === 'mono' ? 'Mono' : 'Sans'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="viewer-feature-grid">
                        {viewerFeatureList.map((feature) => (
                            <article
                                key={feature.title}
                                className="viewer-feature-card"
                                style={{ borderColor: featureAccent }}
                            >
                                <p
                                    className="viewer-feature-title"
                                    style={{ color: featureAccent, fontFamily: currentFontFamily }}
                                >
                                    {feature.title}
                                </p>
                                <p className="viewer-feature-description">{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};
