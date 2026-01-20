import { useEffect, useRef, useState } from 'react';
import '@ifc-viewer/core/styles';
import '../dev/designSystem.css';
import {
    createIFCViewer,
    type ViewerHandle,
    type ElementSelectionDetails,
    getElementCode
} from '@ifc-viewer/core';

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

interface IfcViewerPreviewProps {
    onElementSelect?: (elementInfo: string, details: ElementSelectionDetails) => void;
    onScreenshot?: (screenshot: string) => void;
}

const IfcViewerPreview = ({ onElementSelect, onScreenshot }: IfcViewerPreviewProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<ViewerHandle | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (viewerRef.current) return;

        if (typeof window !== 'undefined') {
            window.WEB_IFC_BASE_PATH = window.location.origin + '/';
        }

        try {
            const viewer = createIFCViewer({
                container,
                theme: viewerTheme,
                appearance: {
                    world: {
                        backgroundColor: '#ffffff',
                        ambientLightColor: '#ffffff',
                        ambientLightIntensity: 0.8,
                        directionalLightColor: '#ffffff',
                        directionalLightIntensity: 1.2,
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
                // v0.2.5: Callback fires twice - first immediately, then with details
                onObjectSelected: async (selection: { _primaryElement?: ElementSelectionDetails } | null) => {
                    const elementDetails = selection?._primaryElement;

                    if (elementDetails) {
                        // Second call: Enhanced data available
                        console.log('🎯 Element details loaded:', elementDetails);

                        // Use helper directly
                        const itemCode = getElementCode(elementDetails);
                        const name = elementDetails.name || 'Unnamed';
                        const type = elementDetails.type || 'Unknown';
                        const info = `${itemCode} (${type} - ${name})`;

                        // Pass details up
                        onElementSelect?.(info, elementDetails);

                        // Capture screenshot automatically
                        try {
                            if (viewer.captureScreenshot) {
                                const screenshot = await viewer.captureScreenshot();
                                onScreenshot?.(screenshot);
                            }
                        } catch (err) {
                            console.warn('Screenshot capture failed:', err);
                        }
                    } else {
                        // First call: Immediate feedback
                        console.log('⏳ Element selected, loading details...');
                    }
                }
            });
            viewerRef.current = viewer;
        } catch (error) {
            console.error('Failed to initialize IFC viewer:', error);
        }

        return undefined;
    }, [onElementSelect, onScreenshot]);

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

export const ComplaintsPage = () => {
    const [itemCode, setItemCode] = useState('');
    const [message, setMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement complaint submission
        console.log('Complaint submitted:', { itemCode, message, imageFile });
    };

    const handleElementSelect = (elementInfo: string) => {
        setItemCode(elementInfo);
    };

    const handleScreenshot = (screenshot: string) => {
        setImagePreview(screenshot);
        // Convert base64 to file if needed, or just keep as preview
    };

    return (
        <div className="space-y-6">
            {/* IFC Viewer Block */}
            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold tracking-tight">Complaints</h2>
                    <p className="text-sm text-gray-700 leading-relaxed mt-2">
                        Dear users, we highly ask you to leave your complaints with exact code of an item, image and your message.
                    </p>
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-3">
                        Click on any element in the viewer to auto-fill the item code
                    </p>
                </div>
                <div className="relative flex-1 min-h-[700px] ifc-viewer-embed">
                    <IfcViewerPreview onElementSelect={handleElementSelect} onScreenshot={handleScreenshot} />
                </div>
            </div>

            {/* Complaints Form Block */}
            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mb-6">
                    <h3 className="text-xl font-bold tracking-tight">Submit Complaint</h3>
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">
                        Fill in the details below
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Item Code Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">
                            Item Code *
                        </label>
                        <input
                            type="text"
                            value={itemCode}
                            onChange={(e) => setItemCode(e.target.value)}
                            placeholder="Click an element in the viewer or enter manually..."
                            className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none transition-colors"
                            required
                        />
                        <p className="text-xs text-gray-500 font-mono">
                            {itemCode ? '✓ Element selected' : 'Click an element in the viewer above'}
                        </p>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">
                            Image (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-black transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                {imagePreview ? (
                                    <div className="space-y-2">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto border border-gray-200"
                                        />
                                        <p className="text-xs text-gray-500 font-mono uppercase">
                                            Click to change image
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-4xl text-gray-400">📷</div>
                                        <p className="text-sm font-mono text-gray-600">
                                            Click to upload image
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono uppercase">
                                            PNG, JPG up to 10MB
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Message Textarea */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">
                            Message *
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe the issue in detail..."
                            className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none transition-colors min-h-[120px] resize-y"
                            required
                        />
                        <p className="text-xs text-gray-500 font-mono">
                            {message.length} characters
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => {
                                setItemCode('');
                                setMessage('');
                                setImageFile(null);
                                setImagePreview(null);
                            }}
                            className="px-6 py-2 border border-gray-300 text-sm font-mono font-semibold hover:border-black transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-black border border-black text-white text-sm font-mono font-semibold hover:border-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Submit Complaint
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
